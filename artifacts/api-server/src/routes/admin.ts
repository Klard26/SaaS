import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  bookingsTable,
  providersTable,
  categoriesTable,
  reviewsTable,
  invoicesTable,
} from "@workspace/db";
import { getAuth } from "@clerk/express";
import { sql, desc, eq, and, gte } from "drizzle-orm";
import { requireAdmin, isAdminUserId } from "../lib/adminAuth";

const router: IRouter = Router();

/**
 * Lightweight introspection so the frontend can conditionally show the
 * "Admin" menu item without leaking the allowlist.
 */
router.get("/admin/me", (req, res): void => {
  const { userId } = getAuth(req);
  res.json({ isAdmin: isAdminUserId(userId) });
});

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  try {
    // Booking counts by status + revenue
    const bookingAgg = await db
      .select({
        status: bookingsTable.status,
        paymentStatus: bookingsTable.paymentStatus,
        cnt: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${bookingsTable.totalPrice}), 0)::float`,
      })
      .from(bookingsTable)
      .groupBy(bookingsTable.status, bookingsTable.paymentStatus);

    let total = 0;
    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;
    let revenueAll = 0;
    let revenuePaid = 0;
    for (const r of bookingAgg) {
      total += r.cnt;
      revenueAll += r.revenue;
      if (r.paymentStatus === "paid") revenuePaid += r.revenue;
      if (r.status === "pending") pending += r.cnt;
      else if (r.status === "confirmed") confirmed += r.cnt;
      else if (r.status === "completed") completed += r.cnt;
      else if (r.status === "cancelled") cancelled += r.cnt;
    }

    const [providersAgg] = await db
      .select({
        total: sql<number>`count(*)::int`,
        premium: sql<number>`count(*) filter (where ${providersTable.subscriptionTier} = 'premium')::int`,
        verified: sql<number>`count(*) filter (where ${providersTable.verified} = true)::int`,
      })
      .from(providersTable);

    const [customersAgg] = await db
      .select({
        total: sql<number>`count(distinct ${bookingsTable.customerId})::int`,
      })
      .from(bookingsTable);

    const [categoriesAgg] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(categoriesTable);

    const [reviewsAgg] = await db
      .select({
        total: sql<number>`count(*)::int`,
        avgRating: sql<number>`coalesce(avg(${reviewsTable.rating}), 0)::float`,
      })
      .from(reviewsTable);

    const [invoicesAgg] = await db
      .select({
        total: sql<number>`count(*) filter (where ${invoicesTable.kind} = 'invoice')::int`,
        storno: sql<number>`count(*) filter (where ${invoicesTable.kind} = 'storno')::int`,
        totalCents: sql<number>`coalesce(sum(${invoicesTable.totalCents}) filter (where ${invoicesTable.kind} = 'invoice'), 0)::bigint`,
      })
      .from(invoicesTable);

    res.json({
      bookings: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        revenueAll: Math.round(revenueAll * 100),
        revenuePaidCents: Math.round(revenuePaid * 100),
      },
      providers: {
        total: providersAgg?.total ?? 0,
        premium: providersAgg?.premium ?? 0,
        verified: providersAgg?.verified ?? 0,
      },
      customers: {
        total: customersAgg?.total ?? 0,
      },
      categories: {
        total: categoriesAgg?.total ?? 0,
      },
      reviews: {
        total: reviewsAgg?.total ?? 0,
        averageRating: Number(reviewsAgg?.avgRating ?? 0),
      },
      invoices: {
        total: invoicesAgg?.total ?? 0,
        storno: invoicesAgg?.storno ?? 0,
        totalCents: Number(invoicesAgg?.totalCents ?? 0),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Daily time-series of bookings and paid revenue for the last `days` days.
 */
router.get("/admin/timeseries", requireAdmin, async (req, res): Promise<void> => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${bookingsTable.createdAt}), 'YYYY-MM-DD')`,
        bookings: sql<number>`count(*)::int`,
        paidRevenue: sql<number>`coalesce(sum(${bookingsTable.totalPrice}) filter (where ${bookingsTable.paymentStatus} = 'paid'), 0)::float`,
      })
      .from(bookingsTable)
      .where(gte(bookingsTable.createdAt, since))
      .groupBy(sql`date_trunc('day', ${bookingsTable.createdAt})`)
      .orderBy(sql`date_trunc('day', ${bookingsTable.createdAt})`);

    res.json(
      rows.map((r) => ({
        day: r.day,
        bookings: r.bookings,
        paidRevenueCents: Math.round(r.paidRevenue * 100),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Admin timeseries failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/providers", requireAdmin, async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: providersTable.id,
        displayName: providersTable.displayName,
        email: providersTable.email,
        category: providersTable.category,
        categorySlug: providersTable.categorySlug,
        city: providersTable.city,
        subscriptionTier: providersTable.subscriptionTier,
        verified: providersTable.verified,
        rating: providersTable.rating,
        reviewCount: providersTable.reviewCount,
        createdAt: providersTable.createdAt,
        bookingCount: sql<number>`(
          select count(*)::int from ${bookingsTable}
          where ${bookingsTable.providerId} = ${providersTable.id}
        )`,
        paidRevenueCents: sql<number>`(
          select coalesce(sum(${bookingsTable.totalPrice} * 100), 0)::bigint from ${bookingsTable}
          where ${bookingsTable.providerId} = ${providersTable.id}
            and ${bookingsTable.paymentStatus} = 'paid'
        )`,
        distinctCustomers: sql<number>`(
          select count(distinct ${bookingsTable.customerId})::int from ${bookingsTable}
          where ${bookingsTable.providerId} = ${providersTable.id}
        )`,
      })
      .from(providersTable)
      .orderBy(desc(providersTable.createdAt));
    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        paidRevenueCents: Number(r.paidRevenueCents),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Admin providers list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/customers", requireAdmin, async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        customerId: bookingsTable.customerId,
        customerName: sql<string | null>`max(${bookingsTable.customerName})`,
        customerEmail: sql<string | null>`max(${bookingsTable.customerEmail})`,
        bookingCount: sql<number>`count(*)::int`,
        paidCount: sql<number>`count(*) filter (where ${bookingsTable.paymentStatus} = 'paid')::int`,
        totalSpentCents: sql<number>`coalesce(sum(${bookingsTable.totalPrice} * 100) filter (where ${bookingsTable.paymentStatus} = 'paid'), 0)::bigint`,
        firstBooking: sql<Date>`min(${bookingsTable.createdAt})`,
        lastBooking: sql<Date>`max(${bookingsTable.createdAt})`,
      })
      .from(bookingsTable)
      .groupBy(bookingsTable.customerId)
      .orderBy(sql`count(*) desc`);
    res.json(
      rows.map((r) => ({
        customerId: r.customerId,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        bookingCount: r.bookingCount,
        paidCount: r.paidCount,
        totalSpentCents: Number(r.totalSpentCents),
        firstBooking: new Date(r.firstBooking).toISOString(),
        lastBooking: new Date(r.lastBooking).toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Admin customers list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/bookings", requireAdmin, async (req, res): Promise<void> => {
  try {
    const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
    const status = typeof req.query.status === "string" ? req.query.status : null;
    const conditions = status ? [eq(bookingsTable.status, status)] : [];
    const rows = await db
      .select()
      .from(bookingsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(bookingsTable.createdAt))
      .limit(limit);
    res.json(
      rows.map((b) => ({
        id: b.id,
        customerId: b.customerId,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        providerId: b.providerId,
        providerName: b.providerName,
        serviceName: b.serviceName,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalPrice: b.totalPrice,
        scheduledAt: b.scheduledAt.toISOString(),
        createdAt: b.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Admin bookings list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/categories", requireAdmin, async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        slug: categoriesTable.slug,
        name: categoriesTable.name,
        requiresDirectBilling: categoriesTable.requiresDirectBilling,
        providerCount: sql<number>`(
          select count(*)::int from ${providersTable}
          where ${providersTable.categorySlug} = ${categoriesTable.slug}
        )`,
        bookingCount: sql<number>`(
          select count(*)::int from ${bookingsTable}
          join ${providersTable} on ${providersTable.id} = ${bookingsTable.providerId}
          where ${providersTable.categorySlug} = ${categoriesTable.slug}
        )`,
        paidRevenueCents: sql<number>`(
          select coalesce(sum(${bookingsTable.totalPrice} * 100), 0)::bigint from ${bookingsTable}
          join ${providersTable} on ${providersTable.id} = ${bookingsTable.providerId}
          where ${providersTable.categorySlug} = ${categoriesTable.slug}
            and ${bookingsTable.paymentStatus} = 'paid'
        )`,
      })
      .from(categoriesTable)
      .orderBy(categoriesTable.name);
    res.json(
      rows.map((r) => ({ ...r, paidRevenueCents: Number(r.paidRevenueCents) })),
    );
  } catch (err) {
    req.log.error({ err }, "Admin categories list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
