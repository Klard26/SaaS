---
name: Klard account deletion — all user-keyed tables
description: The complete set of tables a full account wipe must clear, and the retry-safe deletion ordering.
---

# Klard full account deletion

`DELETE /account/me` must wipe EVERY user-keyed dataset, not just provider/customer core rows. A partial wipe leaves personal/billing data behind (privacy/GDPR failure).

**Tables keyed by the Clerk user id (no FK cascade — must delete explicitly):**
- provider-owned (by `providerId`): `services`, `time_slots`, `reviews`, `bookings` — then the `providers` row (cascades `blocked_slots`, `invoices`).
- customer/user-keyed (by `customerId`/`userId`): `reviews`, `bookings`, `immobilien_kunde`, `offer_acceptances`, `assessments`, `gebaeudecheck_orders`, `gebaeudecheck_credits`.
- Förderschiene (by `userId`): `foerderschiene_reports`, `energieausweis_orders`.
- `verwalter` (by `clerkUserId`) — cascades the whole Energiewechsel/WattWechsel portfolio.
- `user_roles` (by `clerkUserId`) — the strict-role-separation claim.

**Why:** these are spread across many schema files; it's easy to miss tables. In fact `foerderschiene_reports`, `energieausweis_orders`, and `user_roles` were ALL silently orphaned by the wipe until integration tests (`account.integration.test.ts`) caught them. When adding any new table keyed by user/clerk id, add it to the account-deletion transaction AND assert it in that test.

**Retry-safe ordering:** best-effort Stripe cancel (outside tx) → single DB transaction (all deletes above) → `clerkClient.users.deleteUser`. DB deletes are idempotent, so a failed Clerk delete can be safely retried (data already gone). Treat Clerk 404 as success. Do NOT delete Clerk first — its session is needed to authenticate retries, so a mid-failure would orphan DB data forever.
