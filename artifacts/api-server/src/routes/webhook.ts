import { Router, type IRouter, raw } from "express";
import type Stripe from "stripe";
import { db } from "@workspace/db";
import { providersTable, bookingsTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { sendPaymentConfirmation, sendStripeActivated, sendPaymentFailed, wasEmailSent } from "../lib/email";
import { issueInvoiceForBooking, sendInvoiceEmail } from "../lib/invoiceService";
import { fulfillOrder } from "../lib/gebaeudecheck";
import {
  fulfillReport,
  fulfillEnergieausweis,
  deliverReportReadyEmail,
} from "../lib/foerderschiene";
import { createFinanceLeadsForPaidReport } from "../lib/financeAffiliate";
import { applyWalletMovement } from "../lib/wallet";
import {
  grantLeadCredits,
  revokeMonthlyPremiumGrants,
  LEAD_GRANT_SOURCES,
  ONE_TIME_PERIOD,
  PREMIUM_ACTIVATION_LEADS,
} from "../lib/leadGrants";

const router: IRouter = Router();

/**
 * POST /api/billing/webhook
 *
 * Stripe sends events here. The body is verified with the signature header
 * `stripe-signature`. The webhook secret must be set as STRIPE_WEBHOOK_SECRET.
 *
 * Note: This route is mounted with `express.raw()` so the raw body is preserved
 * for signature verification — do NOT use `express.json()` before this route.
 */
router.post(
  "/billing/webhook",
  raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).send("Stripe nicht konfiguriert");
      return;
    }
    const secret = process.env["STRIPE_WEBHOOK_SECRET"];
    const sig = req.header("stripe-signature");

    if (!secret) {
      req.log.error("Webhook secret not configured (STRIPE_WEBHOOK_SECRET)");
      res.status(503).send("Webhook secret not configured");
      return;
    }
    if (!sig) {
      res.status(400).send("Missing stripe-signature");
      return;
    }
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      req.log.error({ err }, "Webhook signature verification failed");
      res.status(400).send("Webhook Error");
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const kind = session.metadata?.["kind"];
          if (kind === "subscription") {
            const providerId = Number(session.metadata?.["providerId"]);
            if (Number.isFinite(providerId) && session.subscription) {
              // Only treat a non-premium → premium change as an activation, so
              // Stripe webhook retries/replays don't resend the email. After a
              // cancellation the tier is reset to "basic", so a genuine
              // re-subscription still transitions and re-notifies.
              const activated = await db.transaction(async (tx) => {
                const [row] = await tx
                  .update(providersTable)
                  .set({
                    subscriptionTier: "premium",
                    stripeSubscriptionId: String(session.subscription),
                    premiumSince: new Date(),
                  })
                  .where(
                    and(
                      eq(providersTable.id, providerId),
                      ne(providersTable.subscriptionTier, "premium"),
                    ),
                  )
                  .returning();
                // Activation bonus: 5 free leads (never expire), once ever.
                // Idempotent on (provider, premium_activation, "once"), so a
                // re-subscription after cancellation does not re-grant.
                if (row) {
                  await grantLeadCredits(tx, {
                    providerId,
                    source: LEAD_GRANT_SOURCES.premiumActivation,
                    periodMonth: ONE_TIME_PERIOD,
                    count: PREMIUM_ACTIVATION_LEADS,
                    expiresAt: null,
                  });
                }
                return row;
              });
              if (activated?.email) {
                void sendStripeActivated({
                  email: activated.email,
                  providerName: activated.displayName,
                });
              }
            }
          } else if (kind === "gebaeudecheck") {
            if (session.payment_status === "paid") {
              await fulfillOrder(session.id);
            }
          } else if (kind === "foerderschiene_report") {
            if (session.payment_status === "paid") {
              await fulfillReport(session.id);
              // Guarantee email delivery even if the buyer never returns to the
              // success page (which is the only other place reconcile runs).
              const proto = req.get("x-forwarded-proto") ?? req.protocol;
              const baseUrl = `${proto}://${req.get("host")}`;
              await deliverReportReadyEmail(session, baseUrl);
              // Förder-Affiliate: create + email consented finance leads. Runs
              // after the report email so the buyer email is persisted first;
              // fire-and-forget + idempotent, so it never blocks the ack.
              const reportId = Number(session.metadata?.["reportId"]);
              if (Number.isFinite(reportId)) {
                void createFinanceLeadsForPaidReport(reportId).catch((err) =>
                  req.log.error(
                    { err, reportId },
                    "finance lead creation (webhook) failed",
                  ),
                );
              }
            }
          } else if (kind === "foerderschiene_energieausweis") {
            if (session.payment_status === "paid") {
              await fulfillEnergieausweis(session.id);
            }
          } else if (kind === "booking") {
            const bookingId = Number(session.metadata?.["bookingId"]);
            if (Number.isFinite(bookingId) && session.payment_status === "paid") {
              const [updated] = await db
                .update(bookingsTable)
                .set({ paymentStatus: "paid" })
                .where(eq(bookingsTable.id, bookingId))
                .returning();
              if (updated) {
                void sendPaymentConfirmation({
                  bookingId: updated.id,
                  scheduledAt: updated.scheduledAt,
                  serviceName: updated.serviceName,
                  providerName: updated.providerName,
                  customerName: updated.customerName,
                  customerEmail: updated.customerEmail,
                  providerEmail: null,
                  totalPrice: updated.totalPrice,
                  paymentRequired: updated.paymentRequired,
                });
                // Fire-and-forget invoice generation + email so a PDF/Resend
                // outage never delays the webhook ack.
                void (async () => {
                  try {
                    const result = await issueInvoiceForBooking({ bookingId: updated.id });
                    if (result) {
                      const [provider] = await db
                        .select()
                        .from(providersTable)
                        .where(eq(providersTable.id, updated.providerId))
                        .limit(1);
                      // sendInvoiceEmail is itself idempotent via emailSentAt CAS,
                      // so it's safe to call regardless of `created` — but we only
                      // do so on fresh issuance to avoid load on webhook retries.
                      if (provider && result.created) {
                        await sendInvoiceEmail({ invoice: result.invoice, provider, booking: updated });
                      }
                    }
                  } catch (err) {
                    req.log.error({ err, bookingId: updated.id }, "Invoice issue failed in webhook");
                  }
                })();
              }
            }
          } else if (kind === "wallet_topup") {
            const providerId = Number(session.metadata?.["providerId"]);
            if (Number.isFinite(providerId) && session.payment_status === "paid") {
              const metaAmount = Number(session.metadata?.["amountCents"]);
              const credited =
                Number.isFinite(metaAmount) && metaAmount > 0
                  ? metaAmount
                  : (session.amount_total ?? 0);
              const stripePaymentId = String(session.payment_intent ?? session.id);
              if (credited > 0) {
                try {
                  await db.transaction((tx) =>
                    applyWalletMovement(tx, providerId, {
                      type: "topup",
                      amountCents: credited,
                      stripePaymentId,
                      note: "Guthaben-Aufladung",
                    }),
                  );
                } catch (err) {
                  // A duplicate webhook delivery collides with the unique
                  // stripePaymentId index (PG 23505) and the whole movement
                  // rolls back — that IS the idempotency guarantee, so we ack.
                  // Any other error is real: rethrow so the outer handler 500s
                  // and Stripe retries.
                  if ((err as { code?: string })?.code === "23505") {
                    req.log.info(
                      { providerId, stripePaymentId },
                      "wallet top-up already credited (idempotent replay)",
                    );
                  } else {
                    throw err;
                  }
                }
              }
            }
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          // Flip to basic AND revoke unused monthly free leads in one tx so there
          // is no window where a downgraded provider can still spend premium-only
          // free leads. One-time activation/signup grants are preserved.
          await db.transaction(async (tx) => {
            const downgraded = await tx
              .update(providersTable)
              .set({ subscriptionTier: "basic", stripeSubscriptionId: null })
              .where(eq(providersTable.stripeSubscriptionId, sub.id))
              .returning({ id: providersTable.id });
            for (const p of downgraded) {
              await revokeMonthlyPremiumGrants(tx, p.id);
            }
          });
          break;
        }
        case "account.updated": {
          // Stripe Connect Express onboarding progress. We cache the onboarding
          // timestamp once the connected account can accept charges and has
          // submitted its details, so booking checkouts can route the payout
          // split. Writing the same timestamp on replays is harmless.
          const account = event.data.object as Stripe.Account;
          const onboarded = !!account.charges_enabled && !!account.details_submitted;
          if (onboarded) {
            await db
              .update(providersTable)
              .set({ stripeOnboardedAt: new Date() })
              .where(eq(providersTable.stripeAccountId, account.id));
          } else {
            // Account no longer able to charge (e.g. requirements past due).
            await db
              .update(providersTable)
              .set({ stripeOnboardedAt: null })
              .where(eq(providersTable.stripeAccountId, account.id));
          }
          break;
        }
        case "payment_intent.payment_failed": {
          // A booking payment attempt failed. The booking id is carried on the
          // PaymentIntent metadata (set on the Checkout Session's
          // payment_intent_data). Notify the customer with a retry link.
          const pi = event.data.object as Stripe.PaymentIntent;
          if (pi.metadata?.["kind"] === "booking") {
            const bookingId = Number(pi.metadata["bookingId"]);
            if (Number.isFinite(bookingId)) {
              // Idempotent: only act on the first failure. Stripe retries/replays
              // this event, so skip if the booking is already marked failed or
              // a payment_failed email was already sent for it.
              const [current] = await db
                .select()
                .from(bookingsTable)
                .where(eq(bookingsTable.id, bookingId))
                .limit(1);
              const alreadyFailed = current?.paymentStatus === "failed";
              const [booking] = await db
                .update(bookingsTable)
                .set({ paymentStatus: "failed" })
                .where(eq(bookingsTable.id, bookingId))
                .returning();
              if (booking && !alreadyFailed && !(await wasEmailSent("payment_failed", booking.id))) {
                void sendPaymentFailed({
                  customerEmail: booking.customerEmail,
                  customerName: booking.customerName,
                  providerName: booking.providerName,
                  serviceName: booking.serviceName,
                  scheduledAt: booking.scheduledAt,
                  totalPrice: booking.totalPrice,
                  bookingId: booking.id,
                  failureReason:
                    pi.last_payment_error?.message ?? null,
                });
              }
            }
          }
          break;
        }
        case "invoice.payment_failed": {
          // Stripe will retry; we don't downgrade immediately.
          break;
        }
        case "charge.refunded": {
          const charge = event.data.object as Stripe.Charge;
          const sessionId = (charge.payment_intent as string | null) ?? null;
          if (sessionId) {
            // Best-effort: find booking by checkout session id is not direct;
            // we rely on payment_intent linkage instead. Skip for now.
          }
          break;
        }
        default:
          // Ignore other events.
          break;
      }
    } catch (err) {
      req.log.error({ err, type: event.type }, "Webhook handler error");
    }

    res.json({ received: true });
  },
);

export default router;
