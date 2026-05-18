import { getUncachableResendClient } from "./resendClient";
import { logger } from "./logger";

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

function fmtDateTime(d: Date | string): string {
  return dt.format(typeof d === "string" ? new Date(d) : d);
}

function wrap(title: string, bodyHtml: string): string {
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
}

async function send(args: SendArgs): Promise<void> {
  try {
    const r = await getUncachableResendClient();
    if (!r) {
      logger.warn({ to: args.to, subject: args.subject }, "Resend not configured — email skipped");
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
    } else {
      logger.info({ to: args.to, subject: args.subject }, "Email sent");
    }
  } catch (err) {
    logger.error({ err, to: args.to }, "Email send threw");
  }
}

// ── Templates ───────────────────────────────────────────────────────────────

export async function sendProviderWelcome(p: {
  email: string;
  displayName: string;
}): Promise<void> {
  if (!p.email) return;
  const html = wrap(
    `Willkommen bei Klard, ${p.displayName}!`,
    `<p>Ihr Berater-Profil wurde erfolgreich angelegt.</p>
     <p>Als nächstes können Sie:</p>
     <ul>
       <li>Ihre Leistungen mit Preisen anlegen</li>
       <li>Verfügbare Termine eintragen</li>
       <li>Ihr Profil mit Logo und Bio vervollständigen</li>
     </ul>
     <p><a href="${APP_URL}/dashboard" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Zum Dashboard</a></p>`,
  );
  await send({
    to: p.email,
    subject: "Willkommen bei Klard",
    html,
    text: `Willkommen bei Klard, ${p.displayName}! Ihr Berater-Profil ist aktiv. Dashboard: ${APP_URL}/dashboard`,
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
}

export async function sendBookingConfirmationToCustomer(
  ctx: BookingEmailContext,
  icsContent?: string,
): Promise<void> {
  if (!ctx.customerEmail) return;
  const when = fmtDateTime(ctx.scheduledAt);
  const html = wrap(
    "Termin bestätigt",
    `<p>Hallo${ctx.customerName ? ` ${ctx.customerName}` : ""},</p>
     <p>Ihr Termin bei <strong>${ctx.providerName}</strong> ist gebucht.</p>
     <table style="font-size:14px;line-height:1.6">
       <tr><td><strong>Leistung:</strong></td><td>&nbsp;${ctx.serviceName}</td></tr>
       <tr><td><strong>Termin:</strong></td><td>&nbsp;${when}</td></tr>
       <tr><td><strong>Preis:</strong></td><td>&nbsp;${ctx.totalPrice.toFixed(2)} €${ctx.paymentRequired ? "" : " (Direktabrechnung)"}</td></tr>
     </table>
     ${ctx.notes ? `<p><strong>Ihre Notiz:</strong> ${ctx.notes}</p>` : ""}
     <p>Den Kalendereintrag (.ics) finden Sie im Anhang.</p>
     <p><a href="${APP_URL}/bookings" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Meine Buchungen</a></p>`,
  );
  await send({
    to: ctx.customerEmail,
    subject: `Terminbestätigung – ${ctx.providerName} am ${when}`,
    html,
    text: `Termin bestätigt bei ${ctx.providerName} am ${when} (${ctx.serviceName}).`,
    attachments: icsContent
      ? [{ filename: "termin.ics", content: icsContent }]
      : undefined,
  });
}

export async function sendNewBookingToProvider(ctx: BookingEmailContext): Promise<void> {
  if (!ctx.providerEmail) return;
  const when = fmtDateTime(ctx.scheduledAt);
  const html = wrap(
    "Neue Buchung",
    `<p>Sie haben eine neue Buchung über Klard erhalten.</p>
     <table style="font-size:14px;line-height:1.6">
       <tr><td><strong>Kunde:</strong></td><td>&nbsp;${ctx.customerName ?? "—"}${ctx.customerEmail ? ` (${ctx.customerEmail})` : ""}</td></tr>
       <tr><td><strong>Leistung:</strong></td><td>&nbsp;${ctx.serviceName}</td></tr>
       <tr><td><strong>Termin:</strong></td><td>&nbsp;${when}</td></tr>
     </table>
     ${ctx.notes ? `<p><strong>Notiz vom Kunden:</strong> ${ctx.notes}</p>` : ""}
     <p><a href="${APP_URL}/dashboard" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Im Dashboard öffnen</a></p>`,
  );
  await send({
    to: ctx.providerEmail,
    subject: `Neue Buchung – ${ctx.customerName ?? "Kunde"} am ${when}`,
    html,
    text: `Neue Buchung von ${ctx.customerName ?? "Kunde"} am ${when}.`,
  });
}

export async function sendBookingCancellation(
  ctx: BookingEmailContext,
  cancelledBy: "customer" | "provider",
): Promise<void> {
  const when = fmtDateTime(ctx.scheduledAt);
  const subject = `Termin storniert – ${ctx.providerName} am ${when}`;
  const who = cancelledBy === "customer" ? "vom Kunden" : "vom Berater";
  const body = (recipient: "customer" | "provider") => wrap(
    "Termin storniert",
    `<p>Der folgende Termin wurde ${who} storniert:</p>
     <table style="font-size:14px;line-height:1.6">
       <tr><td><strong>Berater:</strong></td><td>&nbsp;${ctx.providerName}</td></tr>
       <tr><td><strong>Leistung:</strong></td><td>&nbsp;${ctx.serviceName}</td></tr>
       <tr><td><strong>Termin:</strong></td><td>&nbsp;${when}</td></tr>
     </table>
     <p>${recipient === "customer" ? "Sie können jederzeit einen neuen Termin buchen." : "Der Termin steht wieder zur Verfügung."}</p>`,
  );
  if (ctx.customerEmail) {
    await send({ to: ctx.customerEmail, subject, html: body("customer") });
  }
  if (ctx.providerEmail) {
    await send({ to: ctx.providerEmail, subject, html: body("provider") });
  }
}

export async function sendPaymentConfirmation(ctx: BookingEmailContext): Promise<void> {
  if (!ctx.customerEmail) return;
  const when = fmtDateTime(ctx.scheduledAt);
  const html = wrap(
    "Zahlung erhalten",
    `<p>Vielen Dank! Ihre Zahlung von <strong>${ctx.totalPrice.toFixed(2)} €</strong> für den Termin bei ${ctx.providerName} (${ctx.serviceName}) am ${when} wurde erfolgreich verarbeitet.</p>
     <p>Eine Quittung erhalten Sie automatisch von unserem Zahlungsdienstleister Stripe.</p>
     <p><a href="${APP_URL}/bookings" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Meine Buchungen</a></p>`,
  );
  await send({
    to: ctx.customerEmail,
    subject: `Zahlung bestätigt – ${ctx.providerName} am ${when}`,
    html,
    text: `Zahlung über ${ctx.totalPrice.toFixed(2)} € erhalten.`,
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
  const html = wrap(
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
}): Promise<void> {
  const totalEur = (p.totalCents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  const isStorno = p.kind === "storno";
  const title = isStorno ? "Stornorechnung" : "Ihre Rechnung";
  const subject = `${title} ${p.invoiceNumber} – ${p.providerName}`;
  const html = wrap(
    title,
    `<p>Hallo${p.customerName ? ` ${p.customerName}` : ""},</p>
     <p>${isStorno
        ? `anbei erhalten Sie die <strong>Stornorechnung ${p.invoiceNumber}</strong> für Ihren stornierten Termin bei ${p.providerName}.`
        : `vielen Dank für Ihre Buchung bei ${p.providerName}. Anbei erhalten Sie Ihre Rechnung <strong>${p.invoiceNumber}</strong> über <strong>${totalEur}</strong>.`}</p>
     <p>Die Rechnung ist als PDF im Anhang dieser E-Mail.</p>
     <p><a href="${APP_URL}/bookings" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Meine Buchungen</a></p>`,
  );
  await send({
    to: p.to,
    subject,
    html,
    text: `${title} ${p.invoiceNumber} – ${p.providerName}. Betrag: ${totalEur}.`,
    attachments: [{ filename: p.filename, content: p.pdfBase64, isBase64: true }],
  });
}

export async function sendBookingReminder(ctx: BookingEmailContext): Promise<void> {
  if (!ctx.customerEmail) return;
  const when = fmtDateTime(ctx.scheduledAt);
  const html = wrap(
    "Erinnerung: Ihr Termin morgen",
    `<p>Hallo${ctx.customerName ? ` ${ctx.customerName}` : ""},</p>
     <p>kleine Erinnerung an Ihren Termin <strong>morgen</strong>:</p>
     <table style="font-size:14px;line-height:1.6">
       <tr><td><strong>Berater:</strong></td><td>&nbsp;${ctx.providerName}</td></tr>
       <tr><td><strong>Leistung:</strong></td><td>&nbsp;${ctx.serviceName}</td></tr>
       <tr><td><strong>Termin:</strong></td><td>&nbsp;${when}</td></tr>
     </table>
     <p>Wir wünschen Ihnen ein erfolgreiches Gespräch.</p>`,
  );
  await send({
    to: ctx.customerEmail,
    subject: `Erinnerung: Termin morgen bei ${ctx.providerName}`,
    html,
    text: `Erinnerung: Termin morgen um ${when} bei ${ctx.providerName}.`,
  });
}
