import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// ---------------------------------------------------------------------------
// Integration tests for the booking + billing route handlers.
//
// These exercise the real Express app and route handlers against the live
// (development) Postgres database. Only the external edges are mocked:
//   - Clerk auth (getAuth / clerkClient) so we can drive the authenticated
//     user id per request,
//   - Stripe (getUncachableStripeClient) so we can capture Checkout session
//     params (the Connect destination-charge split) without hitting Stripe,
//   - email + invoice side effects (fire-and-forget) so no real mail is sent.
//
// Everything else — the query layer, the booking transaction (row locking,
// SLOT_TAKEN/SLOT_BLOCKED/SLOT_PROVIDER_MISMATCH), status transitions and
// authorization — runs for real against the DB.
// ---------------------------------------------------------------------------

const authState = vi.hoisted(() => ({ userId: null as string | null }));
const stripeState = vi.hoisted(() => ({
  lastSessionArgs: null as Record<string, unknown> | null,
}));

vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: authState.userId }),
  clerkClient: {
    users: {
      getUser: async (id: string) => ({
        id,
        firstName: "Test",
        lastName: "Kunde",
        username: "testkunde",
        primaryEmailAddress: { emailAddress: "kunde@example.com" },
      }),
    },
  },
  clerkMiddleware:
    () =>
    (_req: unknown, _res: unknown, next: () => void): void =>
      next(),
}));

vi.mock("../lib/stripeClient", () => ({
  STRIPE_CONFIG: {
    premiumPriceEur: 89,
    premiumProductName: "Klard Premium (Berater)",
    currency: "eur",
  },
  isStripeConfigured: async () => true,
  getUncachableStripeClient: async () => ({
    checkout: {
      sessions: {
        create: async (args: Record<string, unknown>) => {
          stripeState.lastSessionArgs = args;
          return { id: "cs_test_integration_123", url: "https://stripe.test/pay" };
        },
      },
    },
  }),
}));

// Silence all fire-and-forget side effects (email + invoice/PDF). These are the
// only email/invoice functions imported by the bookings + billing routers.
vi.mock("../lib/email", () => ({
  sendBookingConfirmationToCustomer: async () => undefined,
  sendNewBookingToProvider: async () => undefined,
  sendBookingCancellation: async () => undefined,
}));
vi.mock("../lib/invoiceService", () => ({
  issueStornoForBooking: async () => null,
  sendInvoiceEmail: async () => undefined,
}));

import express, { type Express } from "express";
import bookingsRouter from "./bookings";
import billingRouter from "./billing";
import {
  db,
  providersTable,
  servicesTable,
  timeSlotsTable,
  categoriesTable,
  blockedSlotsTable,
  bookingsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

// A minimal Express app that mounts only the routers under test, mirroring the
// real `/api` mount point. We avoid importing the full app.ts to keep the
// import graph small (no pino-pretty worker, no template/PDF/AI modules) — the
// route handlers, DB queries and transactions exercised here are the real ones.
function makeApp(): Express {
  const app = express();
  app.use((req, _res, next) => {
    (req as unknown as { log: Record<string, () => void> }).log = {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    };
    next();
  });
  app.use(express.json());
  app.use("/api", bookingsRouter);
  app.use("/api", billingRouter);
  return app;
}

const sfx = `itest_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const customerId = `${sfx}_customer`;
const otherUserId = `${sfx}_other`;
const providerAUser = `${sfx}_providerA`;
const providerBUser = `${sfx}_providerB`;
const categorySlug = `${sfx}_cat`;

let server: Server;
let baseUrl: string;

let providerA: typeof providersTable.$inferSelect;
let providerB: typeof providersTable.$inferSelect;
let serviceA: typeof servicesTable.$inferSelect;
let serviceB: typeof servicesTable.$inferSelect;

function hourFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3600_000);
}

async function createSlot(
  providerId: number,
  start: Date,
  isAvailable = true,
): Promise<typeof timeSlotsTable.$inferSelect> {
  const [slot] = await db
    .insert(timeSlotsTable)
    .values({
      providerId,
      startTime: start,
      endTime: new Date(start.getTime() + 3600_000),
      isAvailable,
    })
    .returning();
  return slot!;
}

async function api(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

beforeAll(async () => {
  server = makeApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const port = (server.address() as AddressInfo).port;
  baseUrl = `http://127.0.0.1:${port}`;

  await db
    .insert(categoriesTable)
    .values({
      name: "Integration Test Kategorie",
      slug: categorySlug,
      requiresDirectBilling: false,
    });

  const [pA] = await db
    .insert(providersTable)
    .values({
      clerkUserId: providerAUser,
      displayName: "Berater A (itest)",
      email: "beraterA@example.com",
      category: "Integration Test Kategorie",
      categorySlug,
      city: "Berlin",
      zip: "10115",
    })
    .returning();
  providerA = pA!;

  const [pB] = await db
    .insert(providersTable)
    .values({
      clerkUserId: providerBUser,
      displayName: "Berater B (itest)",
      email: "beraterB@example.com",
      category: "Integration Test Kategorie",
      categorySlug,
      city: "Hamburg",
      zip: "20095",
      // B is fully Connect-onboarded → destination-charge split eligible.
      stripeAccountId: "acct_test_integration",
      stripeOnboardedAt: new Date(),
      subscriptionTier: "basic",
    })
    .returning();
  providerB = pB!;

  const [sA] = await db
    .insert(servicesTable)
    .values({
      providerId: providerA.id,
      name: "Erstberatung A",
      price: 120,
      durationMinutes: 60,
    })
    .returning();
  serviceA = sA!;

  const [sB] = await db
    .insert(servicesTable)
    .values({
      providerId: providerB.id,
      name: "Erstberatung B",
      price: 200,
      durationMinutes: 60,
    })
    .returning();
  serviceB = sB!;
});

afterAll(async () => {
  const providerIds = [providerA?.id, providerB?.id].filter(
    (x): x is number => typeof x === "number",
  );
  await db
    .delete(bookingsTable)
    .where(inArray(bookingsTable.customerId, [customerId, otherUserId]));
  if (providerIds.length) {
    await db
      .delete(blockedSlotsTable)
      .where(inArray(blockedSlotsTable.providerId, providerIds));
    await db
      .delete(timeSlotsTable)
      .where(inArray(timeSlotsTable.providerId, providerIds));
    await db
      .delete(servicesTable)
      .where(inArray(servicesTable.providerId, providerIds));
    await db.delete(providersTable).where(inArray(providersTable.id, providerIds));
  }
  await db.delete(categoriesTable).where(eq(categoriesTable.slug, categorySlug));
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  authState.userId = null;
  stripeState.lastSessionArgs = null;
});

describe("POST /api/bookings", () => {
  it("rejects unauthenticated requests with 401", async () => {
    authState.userId = null;
    const slot = await createSlot(providerA.id, hourFromNow(24));
    const res = await api("POST", "/api/bookings", {
      providerId: providerA.id,
      serviceId: serviceA.id,
      slotId: slot.id,
    });
    expect(res.status).toBe(401);
  });

  it("creates a booking, marks the slot unavailable, and computes price server-side", async () => {
    authState.userId = customerId;
    const slot = await createSlot(providerA.id, hourFromNow(25));

    const res = await api("POST", "/api/bookings", {
      providerId: providerA.id,
      serviceId: serviceA.id,
      slotId: slot.id,
      // A bogus client-supplied price must be ignored (server-authoritative).
      notes: "Bitte vormittags",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.totalPrice).toBe(serviceA.price);
    expect(res.body.customerId).toBe(customerId);
    // Standard category requires payment via Klard.
    expect(res.body.paymentRequired).toBe(true);
    expect(res.body.paymentStatus).toBe("pending");

    const [persisted] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, res.body.id));
    expect(persisted?.serviceName).toBe(serviceA.name);

    const [slotAfter] = await db
      .select()
      .from(timeSlotsTable)
      .where(eq(timeSlotsTable.id, slot.id));
    expect(slotAfter?.isAvailable).toBe(false);
  });

  it("rejects a service that belongs to a different provider (400)", async () => {
    authState.userId = customerId;
    const slot = await createSlot(providerA.id, hourFromNow(26));
    const res = await api("POST", "/api/bookings", {
      providerId: providerA.id,
      serviceId: serviceB.id, // belongs to provider B
      slotId: slot.id,
    });
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toContain("Leistung");
  });

  it("rejects a slot that belongs to a different provider (400, SLOT_PROVIDER_MISMATCH)", async () => {
    authState.userId = customerId;
    const slotForB = await createSlot(providerB.id, hourFromNow(27));
    const res = await api("POST", "/api/bookings", {
      providerId: providerA.id,
      serviceId: serviceA.id,
      slotId: slotForB.id, // slot is provider B's
    });
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toContain("Termin gehört nicht");
  });

  it("rejects booking a slot blocked by an external calendar (409, SLOT_BLOCKED)", async () => {
    authState.userId = customerId;
    const start = hourFromNow(28);
    const slot = await createSlot(providerA.id, start);
    // External busy interval overlapping the slot.
    await db.insert(blockedSlotsTable).values({
      providerId: providerA.id,
      startTime: new Date(start.getTime() - 30 * 60_000),
      endTime: new Date(start.getTime() + 30 * 60_000),
      source: "ical",
    });

    const res = await api("POST", "/api/bookings", {
      providerId: providerA.id,
      serviceId: serviceA.id,
      slotId: slot.id,
    });
    expect(res.status).toBe(409);
    expect(String(res.body.error)).toContain("Kalender");

    // The slot must remain available since the booking was rejected.
    const [slotAfter] = await db
      .select()
      .from(timeSlotsTable)
      .where(eq(timeSlotsTable.id, slot.id));
    expect(slotAfter?.isAvailable).toBe(true);
  });

  it("returns 409 (SLOT_TAKEN) when the slot is already unavailable", async () => {
    authState.userId = customerId;
    const slot = await createSlot(providerA.id, hourFromNow(29), false);
    const res = await api("POST", "/api/bookings", {
      providerId: providerA.id,
      serviceId: serviceA.id,
      slotId: slot.id,
    });
    expect(res.status).toBe(409);
    expect(String(res.body.error)).toContain("gerade gebucht");
  });

  it("lets only ONE of N concurrent requests win the same open slot (real row-lock contention)", async () => {
    authState.userId = customerId;
    // One genuinely available slot, far in the future to avoid colliding with
    // other tests' fixtures.
    const slot = await createSlot(providerA.id, hourFromNow(500));

    // Fire N truly simultaneous POSTs at the SAME open slot. The booking tx's
    // `SELECT ... FOR UPDATE` must serialize them so exactly one inserts a row
    // and flips the slot to unavailable; the rest must re-read it as taken.
    const N = 8;
    const results = await Promise.all(
      Array.from({ length: N }, () =>
        api("POST", "/api/bookings", {
          providerId: providerA.id,
          serviceId: serviceA.id,
          slotId: slot.id,
        }),
      ),
    );

    const created = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    // Exactly one winner; everyone else gets a clean SLOT_TAKEN conflict.
    expect(created.length).toBe(1);
    expect(conflicts.length).toBe(N - 1);
    for (const c of conflicts) {
      expect(String(c.body.error)).toContain("gerade gebucht");
    }

    // The slot ends up unavailable...
    const [slotAfter] = await db
      .select()
      .from(timeSlotsTable)
      .where(eq(timeSlotsTable.id, slot.id));
    expect(slotAfter?.isAvailable).toBe(false);

    // ...with exactly one persisted booking row for it.
    const bookingsForSlot = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.slotId, slot.id));
    expect(bookingsForSlot.length).toBe(1);
    expect(bookingsForSlot[0]?.id).toBe(created[0]?.body.id);
  });
});

describe("PATCH /api/bookings/:id/status", () => {
  async function makeBooking(): Promise<number> {
    authState.userId = customerId;
    const slot = await createSlot(providerA.id, hourFromNow(40 + Math.random() * 100));
    const res = await api("POST", "/api/bookings", {
      providerId: providerA.id,
      serviceId: serviceA.id,
      slotId: slot.id,
    });
    expect(res.status).toBe(201);
    return res.body.id as number;
  }

  it("forbids a customer from setting any status other than cancelled (403)", async () => {
    const id = await makeBooking();
    authState.userId = customerId;
    const res = await api("PATCH", `/api/bookings/${id}/status`, {
      status: "confirmed",
    });
    expect(res.status).toBe(403);
  });

  it("forbids an unrelated user from changing status (403)", async () => {
    const id = await makeBooking();
    authState.userId = otherUserId;
    const res = await api("PATCH", `/api/bookings/${id}/status`, {
      status: "confirmed",
    });
    expect(res.status).toBe(403);
  });

  it("lets the owning provider confirm the booking (200)", async () => {
    const id = await makeBooking();
    authState.userId = providerAUser;
    const res = await api("PATCH", `/api/bookings/${id}/status`, {
      status: "confirmed",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirmed");
  });

  it("lets the customer cancel and frees the slot again", async () => {
    authState.userId = customerId;
    const slot = await createSlot(providerA.id, hourFromNow(200));
    const created = await api("POST", "/api/bookings", {
      providerId: providerA.id,
      serviceId: serviceA.id,
      slotId: slot.id,
    });
    expect(created.status).toBe(201);

    const res = await api("PATCH", `/api/bookings/${created.body.id}/status`, {
      status: "cancelled",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");

    const [slotAfter] = await db
      .select()
      .from(timeSlotsTable)
      .where(eq(timeSlotsTable.id, slot.id));
    expect(slotAfter?.isAvailable).toBe(true);
  });
});

describe("POST /api/bookings/:id/payment/checkout (Stripe Connect split)", () => {
  async function insertBillableBooking(opts: {
    providerId: number;
    serviceId: number;
    serviceName: string;
    providerName: string;
    totalPrice: number;
  }): Promise<number> {
    const slot = await createSlot(opts.providerId, hourFromNow(300 + Math.random() * 200), false);
    const [booking] = await db
      .insert(bookingsTable)
      .values({
        customerId,
        customerName: "Test Kunde",
        customerEmail: "kunde@example.com",
        providerId: opts.providerId,
        providerName: opts.providerName,
        serviceId: opts.serviceId,
        serviceName: opts.serviceName,
        slotId: slot.id,
        status: "confirmed",
        totalPrice: opts.totalPrice,
        scheduledAt: slot.startTime,
        paymentRequired: true,
        paymentStatus: "pending",
      })
      .returning();
    return booking!.id;
  }

  it("creates a Checkout session WITHOUT a split when the provider is not Connect-onboarded", async () => {
    authState.userId = customerId;
    const id = await insertBillableBooking({
      providerId: providerA.id, // not onboarded
      serviceId: serviceA.id,
      serviceName: serviceA.name,
      providerName: providerA.displayName,
      totalPrice: 120,
    });

    const res = await api("POST", `/api/bookings/${id}/payment/checkout`);
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe("cs_test_integration_123");

    const args = stripeState.lastSessionArgs!;
    expect(args.mode).toBe("payment");
    const pid = args.payment_intent_data as Record<string, unknown>;
    expect(pid.application_fee_amount).toBeUndefined();
    expect(pid.transfer_data).toBeUndefined();

    const [persisted] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id));
    expect(persisted?.stripeCheckoutSessionId).toBe("cs_test_integration_123");
  });

  it("adds an application fee + destination transfer when the provider IS Connect-onboarded", async () => {
    authState.userId = customerId;
    const total = 200;
    const id = await insertBillableBooking({
      providerId: providerB.id, // onboarded, basic tier → 9%
      serviceId: serviceB.id,
      serviceName: serviceB.name,
      providerName: providerB.displayName,
      totalPrice: total,
    });

    const res = await api("POST", `/api/bookings/${id}/payment/checkout`);
    expect(res.status).toBe(200);

    const pid = stripeState.lastSessionArgs!.payment_intent_data as Record<
      string,
      unknown
    >;
    // basic tier default commission = 9% of 20000 cents = 1800.
    expect(pid.application_fee_amount).toBe(Math.round(total * 100 * 0.09));
    expect(pid.transfer_data).toEqual({
      destination: "acct_test_integration",
    });
  });

  it("refuses to re-charge an already-paid booking (400)", async () => {
    authState.userId = customerId;
    const id = await insertBillableBooking({
      providerId: providerB.id,
      serviceId: serviceB.id,
      serviceName: serviceB.name,
      providerName: providerB.displayName,
      totalPrice: 200,
    });
    await db
      .update(bookingsTable)
      .set({ paymentStatus: "paid" })
      .where(eq(bookingsTable.id, id));

    const res = await api("POST", `/api/bookings/${id}/payment/checkout`);
    expect(res.status).toBe(400);
  });
});
