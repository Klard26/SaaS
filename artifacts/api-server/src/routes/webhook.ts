import { Router, type IRouter, raw } from "express";
import type Stripe from "stripe";
import { db } from "@workspace/db";
import { providersTable, bookingsTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { sendPaymentConfirmation, sendStripeActivated } from "../lib/email";
import { issueInvoiceForBooking, sendInvoiceEmail } from "../lib/invoiceService";
import { fulfillOrder } from "../lib/gebaeudecheck";

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
              const [activated] = await db
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
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          await db
            .update(providersTable)
            .set({ subscriptionTier: "basic", stripeSubscriptionId: null })
            .where(eq(providersTable.stripeSubscriptionId, sub.id));
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
