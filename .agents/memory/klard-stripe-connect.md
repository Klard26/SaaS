---
name: Klard Stripe Connect payout split + commission
description: How the marketplace payout split is wired on booking checkout and where commission rate comes from.
---

Booking payment uses Stripe destination charges: `application_fee_amount` (platform commission) + `transfer_data.destination` (provider `stripeAccountId`), added to the checkout session ONLY when the provider is onboarded (`stripeOnboardedAt` set).

**Why:** Stripe SDK v22.1.1 does not usefully export `Stripe.Checkout.SessionCreateParams.PaymentIntentData` as a standalone type, so the split is built as a plain object and spread inline (`...splitData`) rather than typed explicitly. Onboarding gates the split so non-Connected providers still get normal (platform-collected) payments.

**How to apply:** Commission has ONE source of truth — `effectiveCommissionRate(provider)` in `artifacts/api-server/src/lib/commission.ts`: per-provider `providers.commissionRate` (numeric, nullable) overrides, else tier default (premium 0.04 / basic 0.09, matching the pricing page). Reuse it anywhere fees are computed; do not hardcode 0.04/0.09. Connect onboarding state is kept fresh both by the `account.updated` webhook and lazily by `GET /providers/me/connect` (`accounts.retrieve`).
