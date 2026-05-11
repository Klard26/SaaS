import { db } from "@workspace/db";
import { bookingsTable, providersTable } from "@workspace/db";
import { and, eq, gt, lte, isNull, inArray } from "drizzle-orm";
import { sendBookingReminder } from "./email";
import { logger } from "./logger";

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_HOURS = 24;
const WINDOW_TOLERANCE_HOURS = 25; // send between 24h and 25h before

let timer: NodeJS.Timeout | null = null;

async function tick(): Promise<void> {
  try {
    const now = new Date();
    const lower = new Date(now.getTime() + WINDOW_HOURS * 3600 * 1000);
    const upper = new Date(now.getTime() + WINDOW_TOLERANCE_HOURS * 3600 * 1000);

    const due = await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          isNull(bookingsTable.reminderSentAt),
          inArray(bookingsTable.status, ["pending", "confirmed"]),
          gt(bookingsTable.scheduledAt, lower),
          lte(bookingsTable.scheduledAt, upper),
        ),
      );

    if (due.length === 0) return;

    const providerIds = Array.from(new Set(due.map((b) => b.providerId)));
    const providers = providerIds.length
      ? await db
          .select({ id: providersTable.id, email: providersTable.email })
          .from(providersTable)
          .where(inArray(providersTable.id, providerIds))
      : [];
    const providerEmailById = new Map(providers.map((p) => [p.id, p.email]));

    for (const b of due) {
      await sendBookingReminder({
        bookingId: b.id,
        scheduledAt: b.scheduledAt,
        serviceName: b.serviceName,
        providerName: b.providerName,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        providerEmail: providerEmailById.get(b.providerId) ?? null,
        totalPrice: b.totalPrice,
        paymentRequired: b.paymentRequired,
      });
      await db
        .update(bookingsTable)
        .set({ reminderSentAt: new Date() })
        .where(eq(bookingsTable.id, b.id));
    }

    logger.info({ count: due.length }, "Sent booking reminders");
  } catch (err) {
    logger.error({ err }, "Reminder scheduler tick failed");
  }
}

export function startReminderScheduler(): void {
  if (timer) return;
  // Kick off after 30s so the server is fully ready, then on interval.
  setTimeout(() => {
    void tick();
    timer = setInterval(() => void tick(), CHECK_INTERVAL_MS);
  }, 30_000);
  logger.info("Reminder scheduler scheduled (24h pre-appointment)");
}
