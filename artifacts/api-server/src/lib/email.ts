import { getUncachableResendClient } from "./resendClient";
import { logger } from "./logger";
import { db } from "@workspace/db";
import { emailLogTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";

import tplWelcomeProvider from "../email-templates/welcome_provider.hbs";
import tplBookingConfirmCustomer from "../email-templates/booking_confirmation_customer.hbs";
import tplBookingConfirmProvider from "../email-templates/booking_confirmation_provider.hbs";
import tplCancelledByCustomer from "../email-templates/booking_cancelled_by_customer.hbs";
import tplCancelledByProvider from "../email-templates/booking_cancelled_by_provider.hbs";
import tplReminder24h from "../email-templates/booking_reminder_24h.hbs";
import tplInvoiceReady from "../email-templates/invoice_ready.hbs";
import tplWelcomeCustomer from "../email-templates/welcome_customer.hbs";
import tplStripeActivated from "../email-templates/stripe_activated.hbs";
import tplPaymentFailed from "../email-templates/payment_failed.hbs";
import tplReminder1h from "../email-templates/booking_reminder_1h.hbs";

const APP_URL =
  process.env["APP_URL"] ??
  (process.env["REPLIT_DOMAINS"]?.split(",")[0]
    ? `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`
    : "http://localhost");

const BERLIN_TZ = "Europe/Berlin";
const dt = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: BERLIN_TZ,
});
const dateFmt = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: BERLIN_TZ,
});
const timeFmt = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: BERLIN_TZ,
});

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}
function fmtDateTime(d: Date | string): string {
  return dt.format(toDate(d));
}
function fmtDate(d: Date | string): string {
  return dateFmt.format(toDate(d));
}
function fmtTime(d: Date | string): string {
  return `${timeFmt.format(toDate(d))} Uhr`;
}
function fmtDuration(min?: number | null): string {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} Std. ${m} Min.`;
  if (h) return `${h} Std.`;
  return `${m} Min.`;
}
function eur(amount: number): string {
  return amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function bookingNumber(id: number): string {
  return `KLD-${String(id).padStart(6, "0")}`;
}
function commissionRate(tier?: string | null): number {
  return tier === "premium" ? 0.04 : 0.09;
}

// ── Branded HTML template rendering ──────────────────────────────────────────
// The attached templates mix correct `{{key}}` placeholders with a few
// single-brace `{key}` typos, so the renderer replaces both forms for every
// supplied key, then strips any leftover `{{...}}` placeholder.

type Vars = Record<string, string | number | null | undefined>;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTemplate(tpl: string, vars: Vars): string {
  let out = tpl;
  for (const [key, raw] of Object.entries(vars)) {
    const value = escapeHtml(raw == null ? "" : String(raw));
    out = out.split(`{{${key}}}`).join(value).split(`{${key}}`).join(value);
  }
  // Remove any unreplaced double-brace placeholders so they never reach a user.
  out = out.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, "");
  return out;
}

function legacyWrap(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f7f8;margin:0;padding:24px;color:#111">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
  <h1 style="font-size:20px;margin:0 0 16px">Klard</h1>
  <h2 style="font-size:18px;margin:0 0 12px">${title}</h2>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
  <p style="font-size:12px;color:#6b7280;margin:0">Klard — Berater einfach buchen. <a href="${APP_URL}" style="color:#6b7280">${APP_URL}</a></p>
</div></body></html>`;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: string; isBase64?: boolean }>;
  /** Template identifier (filename stem) for the email_log audit trail. */
  templateId?: string;
  /** Domain object the email relates to (e.g. booking id) for dedupe lookups. */
  relatedId?: string | number | null;
}

async function logEmail(args: SendArgs, status: "sent" | "failed" | "skipped", error?: string): Promise<void> {
  if (!args.templateId) return;
  try {
    await db.insert(emailLogTable).values({
      templateId: args.templateId,
      recipient: args.to,
      relatedId: args.relatedId == null ? null : String(args.relatedId),
      subject: args.subject,
      status,
      error: error ?? null,
    });
  } catch (err) {
    logger.error({ err, templateId: args.templateId }, "Failed to persist email_log entry");
  }
}

/**
 * Returns true if an email with the given templateId (and optional relatedId)
 * has already been logged with status "sent". Used by schedulers to dedupe.
 */
export async function wasEmailSent(templateId: string, relatedId?: string | number | null): Promise<boolean> {
  const conds = [eq(emailLogTable.templateId, templateId), eq(emailLogTable.status, "sent")];
  if (relatedId != null) conds.push(eq(emailLogTable.relatedId, String(relatedId)));
  const [row] = await db
    .select({ id: emailLogTable.id })
    .from(emailLogTable)
    .where(and(...conds))
    .orderBy(desc(emailLogTable.sentAt))
    .limit(1);
  return !!row;
}

async function send(args: SendArgs): Promise<void> {
  try {
    const r = await getUncachableResendClient();
    if (!r) {
      logger.warn({ to: args.to, subject: args.subject }, "Resend not configured — email skipped");
      await logEmail(args, "skipped", "Resend not configured");
      return;
    }
    const { error } = await r.client.emails.send({
      from: r.fromEmail,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      attachments: args.attachments?.map((a) => ({
        filename: a.filename,
        content: a.isBase64 ? a.content : Buffer.from(a.content, "utf8").toString("base64"),
      })),
    });
    if (error) {
      logger.error({ err: error, to: args.to }, "Resend send failed");
      await logEmail(args, "failed", String((error as { message?: string }).message ?? error));
    } else {
      logger.info({ to: args.to, subject: args.subject }, "Email sent");
      await logEmail(args, "sent");
    }
  } catch (err) {
    logger.error({ err, to: args.to }, "Email send threw");
    await logEmail(args, "failed", err instanceof Error ? err.message : String(err));
  }
}

// ── Templates ───────────────────────────────────────────────────────────────

export async function sendProviderWelcome(p: {
  email: string;
  displayName: string;
}): Promise<void> {
  if (!p.email) return;
  const html = renderTemplate(tplWelcomeProvider, {
    providerName: p.displayName,
    dashboardUrl: `${APP_URL}/dashboard`,
  });
  await send({
    to: p.email,
    subject: "Willkommen bei Klard",
    html,
    text: `Willkommen bei Klard, ${p.displayName}! Ihr Berater-Profil ist aktiv. Dashboard: ${APP_URL}/dashboard`,
    templateId: "welcome_provider",
    relatedId: p.email,
  });
}

export async function sendCustomerWelcome(p: {
  email: string;
  customerName: string;
}): Promise<void> {
  if (!p.email) return;
  const html = renderTemplate(tplWelcomeCustomer, {
    customerName: p.customerName,
    accountUrl: `${APP_URL}/search`,
  });
  await send({
    to: p.email,
    subject: "Willkommen bei Klard",
    html,
    text: `Willkommen bei Klard, ${p.customerName}! Jetzt geprüfte Berater finden und buchen: ${APP_URL}/search`,
    templateId: "welcome_customer",
    relatedId: p.email,
  });
}

export async function sendStripeActivated(p: {
  email: string;
  providerName: string;
}): Promise<void> {
  if (!p.email) return;
  const html = renderTemplate(tplStripeActivated, {
    providerName: p.providerName,
    dashboardUrl: `${APP_URL}/dashboard`,
  });
  await send({
    to: p.email,
    subject: "Ihr Klard Premium ist aktiv",
    html,
    text: `Ihr Klard Premium-Abo ist aktiv, ${p.providerName}. Zum Dashboard: ${APP_URL}/dashboard`,
    templateId: "stripe_activated",
    relatedId: p.email,
  });
}

export interface BookingEmailContext {
  bookingId: number;
  scheduledAt: Date | string;
  serviceName: string;
  providerName: string;
  customerName: string | null;
  customerEmail: string | null;
  providerEmail: string | null;
  totalPrice: number;
  paymentRequired: boolean;
  notes?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
  customerPhone?: string | null;
  providerTier?: string | null;
}

function customerConfirmationHtml(ctx: BookingEmailContext, paid: boolean): string {
  let confirmIntro: string;
  let amountLabel: string;
  let amountNote: string;
  if (paid) {
    confirmIntro = "Ihre Buchung wurde erfolgreich bezahlt und bestätigt. Hier sind alle Details:";
    amountLabel = "Bezahlter Betrag";
    amountNote = "Inkl. 19% USt — Ihre Rechnung erhalten Sie nach Leistungserbringung als PDF.";
  } else if (ctx.paymentRequired) {
    confirmIntro = "Ihre Buchung ist eingegangen und bestätigt. Hier sind alle Details:";
    amountLabel = "Betrag";
    amountNote = "Inkl. 19% USt — bitte begleichen Sie den Betrag bequem online in Ihrem Konto.";
  } else {
    confirmIntro = "Ihre Buchung ist bestätigt. Hier sind alle Details:";
    amountLabel = "Betrag";
    amountNote = "Die Abrechnung erfolgt direkt mit Ihrem Berater.";
  }
  return renderTemplate(tplBookingConfirmCustomer, {
    customerName: ctx.customerName ?? "Kunde",
    confirmIntro,
    serviceName: ctx.serviceName,
    providerName: ctx.providerName,
    providerEmail: ctx.providerEmail ?? "hello@klard.de",
    bookingDate: fmtDate(ctx.scheduledAt),
    bookingTime: fmtTime(ctx.scheduledAt),
    bookingDuration: fmtDuration(ctx.durationMinutes),
    bookingLocation: ctx.location || "Wird vom Berater mitgeteilt",
    bookingNumber: bookingNumber(ctx.bookingId),
    amountLabel,
    totalAmount: ctx.paymentRequired ? eur(ctx.totalPrice) : "Direktabrechnung",
    amountNote,
    bookingUrl: `${APP_URL}/bookings`,
    icsUrl: `${APP_URL}/bookings`,
  });
}

export async function sendBookingConfirmationToCustomer(
  ctx: BookingEmailContext,
  icsContent?: string,
): Promise<void> {
  if (!ctx.customerEmail) return;
  const html = customerConfirmationHtml(ctx, false);
  await send({
    to: ctx.customerEmail,
    subject: `Buchung bestätigt – ${ctx.providerName} am ${fmtDate(ctx.scheduledAt)}`,
    html,
    text: `Buchung bestätigt bei ${ctx.providerName} am ${fmtDateTime(ctx.scheduledAt)} (${ctx.serviceName}).`,
    attachments: icsContent
      ? [{ filename: "termin.ics", content: icsContent }]
      : undefined,
    templateId: "booking_confirmation_customer",
    relatedId: ctx.bookingId,
  });
}

export async function sendNewBookingToProvider(ctx: BookingEmailContext): Promise<void> {
  if (!ctx.providerEmail) return;
  const rate = commissionRate(ctx.providerTier);
  const commission = ctx.totalPrice * rate;
  const payout = ctx.totalPrice - commission;
  const providerIntro = ctx.paymentRequired
    ? "Sie haben eine neue Buchung erhalten. Der Termin ist verbindlich eingetragen."
    : "Sie haben eine neue Buchung erhalten. Die Abrechnung erfolgt direkt mit dem Kunden — der Termin ist verbindlich eingetragen.";
  const html = renderTemplate(tplBookingConfirmProvider, {
    providerName: ctx.providerName,
    providerIntro,
    customerName: ctx.customerName ?? "Kunde",
    customerEmail: ctx.customerEmail ?? "—",
    customerPhone: ctx.customerPhone || "—",
    serviceName: ctx.serviceName,
    bookingDate: fmtDate(ctx.scheduledAt),
    bookingTime: fmtTime(ctx.scheduledAt),
    bookingDuration: fmtDuration(ctx.durationMinutes),
    bookingNumber: bookingNumber(ctx.bookingId),
    totalAmount: eur(ctx.totalPrice),
    providerPayout: eur(payout),
    commissionRate: `${Math.round(rate * 100)} %`,
    commissionAmount: eur(commission),
    bookingUrl: `${APP_URL}/dashboard`,
  });
  await send({
    to: ctx.providerEmail,
    subject: `Neue Buchung – ${ctx.customerName ?? "Kunde"} am ${fmtDate(ctx.scheduledAt)}`,
    html,
    text: `Neue Buchung von ${ctx.customerName ?? "Kunde"} am ${fmtDateTime(ctx.scheduledAt)}.`,
    templateId: "booking_confirmation_provider",
    relatedId: ctx.bookingId,
  });
}

export async function sendBookingCancellation(
  ctx: BookingEmailContext,
  cancelledBy: "customer" | "provider",
): Promise<void> {
  const dateStr = fmtDate(ctx.scheduledAt);
  const refundInfo = ctx.paymentRequired
    ? "Falls bereits bezahlt wurde, wird der Betrag automatisch innerhalb von 5–10 Werktagen auf Ihre ursprüngliche Zahlungsmethode erstattet."
    : "Es wurde keine Online-Zahlung über Klard eingezogen — eine Erstattung ist nicht erforderlich.";

  if (cancelledBy === "customer") {
    const baseVars: Vars = {
      serviceName: ctx.serviceName,
      bookingDate: dateStr,
      bookingTime: fmtTime(ctx.scheduledAt),
      cancellationReason: "Auf Kundenwunsch storniert",
      cancelledAt: fmtDateTime(new Date()),
      bookingNumber: bookingNumber(ctx.bookingId),
      refundInfo,
    };
    const subject = `Buchung storniert – ${ctx.providerName} am ${dateStr}`;
    if (ctx.providerEmail) {
      await send({
        to: ctx.providerEmail,
        subject,
        html: renderTemplate(tplCancelledByCustomer, { ...baseVars, recipientName: ctx.providerName }),
        text: `Die Buchung (${ctx.serviceName}) am ${fmtDateTime(ctx.scheduledAt)} wurde vom Kunden storniert.`,
        templateId: "booking_cancelled_by_customer",
        relatedId: ctx.bookingId,
      });
    }
    if (ctx.customerEmail) {
      await send({
        to: ctx.customerEmail,
        subject,
        html: renderTemplate(tplCancelledByCustomer, {
          ...baseVars,
          recipientName: ctx.customerName ?? "Kunde",
        }),
        text: `Ihre Buchung (${ctx.serviceName}) am ${fmtDateTime(ctx.scheduledAt)} wurde storniert.`,
        templateId: "booking_cancelled_by_customer",
        relatedId: ctx.bookingId,
      });
    }
    return;
  }

  // Cancelled by provider — notify the customer with refund + alternatives.
  if (ctx.customerEmail) {
    await send({
      to: ctx.customerEmail,
      subject: `Termin abgesagt – ${ctx.providerName} am ${dateStr}`,
      html: renderTemplate(tplCancelledByProvider, {
        customerName: ctx.customerName ?? "Kunde",
        providerName: ctx.providerName,
        serviceName: ctx.serviceName,
        bookingDate: dateStr,
        bookingTime: fmtTime(ctx.scheduledAt),
        cancellationReason: "Vom Berater abgesagt",
        totalAmount: ctx.paymentRequired ? eur(ctx.totalPrice) : "Direktabrechnung",
        alternativeCount: "zahlreiche",
        branchName: "geprüfte",
        searchUrl: `${APP_URL}/search`,
      }),
      text: `Ihr Termin bei ${ctx.providerName} am ${fmtDateTime(ctx.scheduledAt)} wurde leider abgesagt.`,
      templateId: "booking_cancelled_by_provider",
      relatedId: ctx.bookingId,
    });
  }
}

export async function sendPaymentConfirmation(ctx: BookingEmailContext): Promise<void> {
  if (!ctx.customerEmail) return;
  const html = customerConfirmationHtml(ctx, true);
  await send({
    to: ctx.customerEmail,
    subject: `Zahlung bestätigt – ${ctx.providerName} am ${fmtDate(ctx.scheduledAt)}`,
    html,
    text: `Zahlung über ${eur(ctx.totalPrice)} erhalten — Buchung bei ${ctx.providerName} bestätigt.`,
    templateId: "booking_confirmation_customer",
    relatedId: ctx.bookingId,
  });
}

export async function sendProviderAssessmentSaved(p: {
  providerEmail: string;
  providerName: string;
  label: string;
  energyClass?: string | null;
  marketValue?: number | null;
  city?: string | null;
}): Promise<void> {
  if (!p.providerEmail) return;
  const safeLabel = p.label.replace(/[\r\n]+/g, " ").slice(0, 200);
  const html = legacyWrap(
    `Mandant gespeichert: ${safeLabel}`,
    `<p>Hallo ${p.providerName},</p>
     <p>Sie haben für den Mandanten <strong>${safeLabel}</strong> eine neue Gebäudeanalyse in Ihrem Klard-Dashboard gespeichert.</p>
     <table style="font-size:14px;line-height:1.6">
       ${p.city ? `<tr><td><strong>Standort:</strong></td><td>&nbsp;${p.city}</td></tr>` : ""}
       ${p.energyClass ? `<tr><td><strong>Energieklasse:</strong></td><td>&nbsp;${p.energyClass}</td></tr>` : ""}
       ${p.marketValue ? `<tr><td><strong>Marktwert (Schätzung):</strong></td><td>&nbsp;${Math.round(p.marketValue).toLocaleString("de-DE")} €</td></tr>` : ""}
     </table>
     <p>Sie können den Mandanten jederzeit im Dashboard erneut aufrufen oder mit einem Termin verknüpfen.</p>
     <p><a href="${APP_URL}/dashboard" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Zum Dashboard</a></p>`,
  );
  await send({
    to: p.providerEmail,
    subject: `Mandant gespeichert: ${safeLabel}`,
    html,
    text: `Gebäudeanalyse für ${safeLabel} gespeichert.`,
  });
}

export async function sendInvoiceWithAttachment(p: {
  to: string;
  customerName: string | null;
  providerName: string;
  invoiceNumber: string;
  kind: "invoice" | "storno";
  totalCents: number;
  pdfBase64: string;
  filename: string;
  serviceName?: string | null;
  providerEmail?: string | null;
  performanceDate?: Date | string | null;
}): Promise<void> {
  const totalEur = eur(p.totalCents / 100);
  const isStorno = p.kind === "storno";

  if (isStorno) {
    // No dedicated storno template was provided — keep the simple branded fallback.
    const html = legacyWrap(
      "Stornorechnung",
      `<p>Hallo${p.customerName ? ` ${p.customerName}` : ""},</p>
       <p>anbei erhalten Sie die <strong>Stornorechnung ${p.invoiceNumber}</strong> für Ihren stornierten Termin bei ${p.providerName}.</p>
       <p>Die Rechnung ist als PDF im Anhang dieser E-Mail.</p>
       <p><a href="${APP_URL}/bookings" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Meine Buchungen</a></p>`,
    );
    await send({
      to: p.to,
      subject: `Stornorechnung ${p.invoiceNumber} – ${p.providerName}`,
      html,
      text: `Stornorechnung ${p.invoiceNumber} – ${p.providerName}. Betrag: ${totalEur}.`,
      attachments: [{ filename: p.filename, content: p.pdfBase64, isBase64: true }],
      templateId: "invoice_storno",
      relatedId: p.invoiceNumber,
    });
    return;
  }

  const performance = p.performanceDate ? fmtDate(p.performanceDate) : "—";
  const html = renderTemplate(tplInvoiceReady, {
    customerName: p.customerName ?? "Kunde",
    providerName: p.providerName,
    providerEmail: p.providerEmail ?? "hello@klard.de",
    serviceName: p.serviceName ?? "Beratungsleistung",
    invoiceNumber: p.invoiceNumber,
    invoiceDate: fmtDate(new Date()),
    performanceStart: performance,
    performanceEnd: performance,
    totalAmount: totalEur,
    invoicePdfUrl: `${APP_URL}/bookings`,
  });
  await send({
    to: p.to,
    subject: `Ihre Rechnung ${p.invoiceNumber} – ${p.providerName}`,
    html,
    text: `Ihre Rechnung ${p.invoiceNumber} – ${p.providerName}. Betrag: ${totalEur}.`,
    attachments: [{ filename: p.filename, content: p.pdfBase64, isBase64: true }],
    templateId: "invoice_ready",
    relatedId: p.invoiceNumber,
  });
}

export async function sendBookingReminder(ctx: BookingEmailContext): Promise<void> {
  if (!ctx.customerEmail) return;
  const html = renderTemplate(tplReminder24h, {
    customerName: ctx.customerName ?? "Kunde",
    providerName: ctx.providerName,
    serviceName: ctx.serviceName,
    bookingDate: fmtDate(ctx.scheduledAt),
    bookingTime: fmtTime(ctx.scheduledAt),
    bookingDuration: fmtDuration(ctx.durationMinutes),
    bookingLocation: ctx.location || "Wird vom Berater mitgeteilt",
    prepNote1: "Halten Sie relevante Unterlagen für Ihr Gespräch bereit.",
    prepNote2: "Bei Verhinderung sagen Sie den Termin bitte rechtzeitig ab.",
    bookingUrl: `${APP_URL}/bookings`,
    cancelUrl: `${APP_URL}/bookings`,
  });
  await send({
    to: ctx.customerEmail,
    subject: `Erinnerung: Termin morgen bei ${ctx.providerName}`,
    html,
    text: `Erinnerung: Termin morgen um ${fmtDateTime(ctx.scheduledAt)} bei ${ctx.providerName}.`,
    templateId: "booking_reminder_24h",
    relatedId: ctx.bookingId,
  });
}

/**
 * 1-hour pre-appointment reminder. Sent to BOTH the customer and the provider
 * with role-aware "counterpart" fields. Deduped by the scheduler via email_log.
 */
export async function sendBookingReminder1h(ctx: BookingEmailContext): Promise<void> {
  const dateStr = fmtDate(ctx.scheduledAt);
  const timeStr = fmtTime(ctx.scheduledAt);
  const duration = fmtDuration(ctx.durationMinutes);
  const num = bookingNumber(ctx.bookingId);
  const location = ctx.location || "Wird vom Berater mitgeteilt";

  if (ctx.customerEmail) {
    await send({
      to: ctx.customerEmail,
      subject: `In 1 Stunde: Termin bei ${ctx.providerName}`,
      html: renderTemplate(tplReminder1h, {
        recipientName: ctx.customerName ?? "Kunde",
        serviceName: ctx.serviceName,
        bookingTime: timeStr,
        bookingDuration: duration,
        bookingLocation: location,
        bookingNumber: num,
        counterpartLabel: "Ihr Berater",
        counterpartName: ctx.providerName,
        counterpartEmail: ctx.providerEmail ?? "—",
        counterpartPhone: "—",
        bookingUrl: `${APP_URL}/bookings`,
      }),
      text: `In 1 Stunde: Termin bei ${ctx.providerName} um ${timeStr} (${dateStr}).`,
      templateId: "booking_reminder_1h",
      relatedId: ctx.bookingId,
    });
  }

  if (ctx.providerEmail) {
    await send({
      to: ctx.providerEmail,
      subject: `In 1 Stunde: Termin mit ${ctx.customerName ?? "Kunde"}`,
      html: renderTemplate(tplReminder1h, {
        recipientName: ctx.providerName,
        serviceName: ctx.serviceName,
        bookingTime: timeStr,
        bookingDuration: duration,
        bookingLocation: location,
        bookingNumber: num,
        counterpartLabel: "Ihr Kunde",
        counterpartName: ctx.customerName ?? "Kunde",
        counterpartEmail: ctx.customerEmail ?? "—",
        counterpartPhone: ctx.customerPhone || "—",
        bookingUrl: `${APP_URL}/dashboard`,
      }),
      text: `In 1 Stunde: Termin mit ${ctx.customerName ?? "Kunde"} um ${timeStr} (${dateStr}).`,
      templateId: "booking_reminder_1h",
      relatedId: ctx.bookingId,
    });
  }
}

/**
 * Notifies the customer that an online payment attempt for a booking failed,
 * with a link to retry.
 */
export async function sendPaymentFailed(p: {
  customerEmail: string | null;
  customerName: string | null;
  providerName: string;
  serviceName: string;
  scheduledAt: Date | string;
  totalPrice: number;
  bookingId: number;
  failureReason?: string | null;
}): Promise<void> {
  if (!p.customerEmail) return;
  const html = renderTemplate(tplPaymentFailed, {
    customerName: p.customerName ?? "Kunde",
    providerName: p.providerName,
    serviceName: p.serviceName,
    bookingDate: fmtDate(p.scheduledAt),
    bookingTime: fmtTime(p.scheduledAt),
    totalAmount: eur(p.totalPrice),
    failureReason: p.failureReason || "Die Zahlung konnte nicht abgeschlossen werden.",
    retryUrl: `${APP_URL}/bookings`,
  });
  await send({
    to: p.customerEmail,
    subject: `Zahlung fehlgeschlagen – ${p.providerName}`,
    html,
    text: `Ihre Zahlung für den Termin bei ${p.providerName} ist fehlgeschlagen. Bitte erneut versuchen: ${APP_URL}/bookings`,
    templateId: "payment_failed",
    relatedId: p.bookingId,
  });
}
