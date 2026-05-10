import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, timeSlotsTable, servicesTable, providersTable, categoriesTable } from "@workspace/db";
import { clerkClient } from "@clerk/express";
import {
  CreateBookingBody,
  GetBookingParams,
  UpdateBookingStatusParams,
  UpdateBookingStatusBody,
  ListProviderBookingsParams,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.post("/bookings", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const parsed = CreateBookingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const d = parsed.data;

    const [slot] = await db
      .select()
      .from(timeSlotsTable)
      .where(
        and(eq(timeSlotsTable.id, d.slotId), eq(timeSlotsTable.isAvailable, true)),
      )
      .limit(1);

    if (!slot) {
      res.status(400).json({ error: "Time slot not available" });
      return;
    }

    const [service] = await db
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.id, d.serviceId))
      .limit(1);

    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, d.providerId))
      .limit(1);

    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, provider.categorySlug))
      .limit(1);

    const paymentRequired = !(category?.requiresDirectBilling ?? false);

    let customerName: string | null = null;
    let customerEmail: string | null = null;
    try {
      const u = await clerkClient.users.getUser(userId);
      customerName =
        [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null;
      customerEmail = u.primaryEmailAddress?.emailAddress ?? null;
    } catch (e) {
      req.log.warn({ err: e }, "Failed to load Clerk user for booking");
    }

    const [booking] = await db
      .insert(bookingsTable)
      .values({
        customerId: userId,
        customerName,
        customerEmail,
        providerId: d.providerId,
        providerName: provider.displayName,
        serviceId: d.serviceId,
        serviceName: service.name,
        slotId: d.slotId,
        status: "pending",
        totalPrice: service.price,
        scheduledAt: slot.startTime,
        notes: d.notes,
        paymentRequired,
        paymentStatus: paymentRequired ? "pending" : "not_required",
      })
      .returning();

    await db
      .update(timeSlotsTable)
      .set({ isAvailable: false })
      .where(eq(timeSlotsTable.id, d.slotId));

    res.status(201).json(booking);
  } catch (err) {
    req.log.error({ err }, "Failed to create booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookings", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.customerId, userId))
      .orderBy(bookingsTable.scheduledAt);
    res.json(bookings);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch bookings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  try {
    const parsed = GetBookingParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, parsed.data.id))
      .limit(1);

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    res.json(booking);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/bookings/:id/status", async (req, res): Promise<void> => {
  try {
    const paramsParsed = UpdateBookingStatusParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const bodyParsed = UpdateBookingStatusBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }
    const [updated] = await db
      .update(bookingsTable)
      .set({ status: bodyParsed.data.status })
      .where(eq(bookingsTable.id, paramsParsed.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    if (bodyParsed.data.status === "cancelled") {
      await db
        .update(timeSlotsTable)
        .set({ isAvailable: true })
        .where(eq(timeSlotsTable.id, updated.slotId));
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update booking status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/providers/:id/bookings", async (req, res): Promise<void> => {
  try {
    const parsed = ListProviderBookingsParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.providerId, parsed.data.id))
      .orderBy(bookingsTable.scheduledAt);
    res.json(bookings);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider bookings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
