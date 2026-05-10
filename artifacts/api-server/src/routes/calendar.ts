import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, providersTable, servicesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  durationMinutes: number;
  location?: string;
}

function buildIcs(events: IcsEvent[], calName: string): string {
  const now = toIcsDate(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Klard//Booking//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calName)}`,
    "X-WR-TIMEZONE:Europe/Berlin",
  ];
  for (const ev of events) {
    const end = new Date(ev.start.getTime() + ev.durationMinutes * 60_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(ev.start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${escapeIcs(ev.summary)}`,
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeIcs(ev.location)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

router.get("/providers/:id/calendar.ics", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).send("Invalid id");
      return;
    }
    const token = String(req.query.token ?? "");
    if (!token) {
      res.status(403).send("Forbidden");
      return;
    }
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, id))
      .limit(1);

    if (!provider || !provider.icalToken || provider.icalToken !== token) {
      res.status(403).send("Forbidden");
      return;
    }
    if (provider.subscriptionTier !== "premium") {
      res.status(402).send("Calendar sync is a Premium feature");
      return;
    }

    const rows = await db
      .select({
        id: bookingsTable.id,
        scheduledAt: bookingsTable.scheduledAt,
        serviceName: bookingsTable.serviceName,
        customerName: bookingsTable.customerName,
        totalPrice: bookingsTable.totalPrice,
        status: bookingsTable.status,
        notes: bookingsTable.notes,
        durationMinutes: servicesTable.durationMinutes,
      })
      .from(bookingsTable)
      .leftJoin(servicesTable, eq(servicesTable.id, bookingsTable.serviceId))
      .where(
        and(
          eq(bookingsTable.providerId, id),
          eq(bookingsTable.status, "confirmed"),
        ),
      );

    const ics = buildIcs(
      rows.map((b) => ({
        uid: `booking-${b.id}@klard`,
        summary: `${b.serviceName} – ${b.customerName ?? "Kunde"}`,
        description: `Status: ${b.status}\\nPreis: ${b.totalPrice} EUR${b.notes ? `\\nNotiz: ${b.notes}` : ""}`,
        start: b.scheduledAt,
        durationMinutes: b.durationMinutes ?? 60,
        location: provider.address ?? `${provider.zip} ${provider.city}`,
      })),
      `Klard – ${provider.displayName}`,
    );

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="klard-${provider.id}.ics"`,
    );
    res.send(ics);
  } catch (err) {
    req.log.error({ err }, "Failed to render provider ics feed");
    res.status(500).send("Error");
  }
});

router.get("/bookings/:id/calendar.ics", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).send("Unauthorized");
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).send("Invalid id");
      return;
    }
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);
    if (!booking) {
      res.status(404).send("Not found");
      return;
    }
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, booking.providerId))
      .limit(1);

    const isCustomer = booking.customerId === userId;
    const isProvider = provider?.clerkUserId === userId;
    if (!isCustomer && !isProvider) {
      res.status(403).send("Forbidden");
      return;
    }

    const [service] = booking.serviceId
      ? await db
          .select({ durationMinutes: servicesTable.durationMinutes })
          .from(servicesTable)
          .where(eq(servicesTable.id, booking.serviceId))
          .limit(1)
      : [];

    const ics = buildIcs(
      [
        {
          uid: `booking-${booking.id}@klard`,
          summary: `Termin: ${booking.serviceName} bei ${booking.providerName}`,
          description: `Buchung #${booking.id}\\nStatus: ${booking.status}\\nPreis: ${booking.totalPrice} EUR`,
          start: booking.scheduledAt,
          durationMinutes: service?.durationMinutes ?? 60,
          location: provider?.address ?? `${provider?.zip ?? ""} ${provider?.city ?? ""}`.trim(),
        },
      ],
      `Klard Termin #${booking.id}`,
    );

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="klard-termin-${booking.id}.ics"`,
    );
    res.send(ics);
  } catch (err) {
    req.log.error({ err }, "Failed to render booking ics");
    res.status(500).send("Error");
  }
});

export default router;
