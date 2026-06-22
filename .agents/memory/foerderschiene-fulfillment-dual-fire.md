---
name: Förderschiene report-fulfillment runs from two callers
description: Any side effect hung off paid-report fulfillment fires from BOTH the Stripe webhook and the success-page reconcile — must be idempotent AND race-safe, not just deduped-by-read.
---

# Förderschiene paid-report fulfillment is dual-fire

Every side effect attached to a PAID Förderschiene report (report-ready email,
finance-affiliate lead creation + partner emails, …) is invoked from **two
independent callers that can run concurrently**: the Stripe webhook
(`checkout.session.completed`) and the `/foerderschiene/report/reconcile`
success-page path. Treat fulfillment as at-least-twice, possibly simultaneous.

**Why:** delivery must not depend on the buyer returning to the success page, so
the webhook duplicates it. Both can pass the same guards at the same instant.

**How to apply:**
- Row creation: rely on a DB unique constraint + `onConflictDoNothing`
  (finance leads use a unique `(report_id, partner_id)` index). Read-then-insert
  is not enough.
- External side effects (emails): a read-only dedup (`wasEmailSent(...)` before
  send) is NOT race-safe — both callers read "not sent", both send. Use an
  atomic claim: CAS the row from its pending state to a transient `sending`
  state (`UPDATE … WHERE id=? AND status='created' RETURNING`); only the caller
  that gets a row back sends, then flips to `sent`; revert to the pending state
  on failure so a retry re-claims. Keep `wasEmailSent` as a cross-invocation
  backstop (restarts / Stripe redeliveries), not the primary guard.
- A transient claim state (e.g. `sending`) can briefly surface in admin lists —
  give it a label/badge and exclude it from actions, but it need not be a filter.

**GDPR aside:** consent-proof fields (version + text + timestamp) are snapshotted
from SERVER-side constants at checkout; never trust client-supplied
version/text, or the audit record can be forged.
