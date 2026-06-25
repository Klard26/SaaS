---
name: Free-lead grant consumption concurrency
description: Why grant counters are consumed with blocking lock-all-rows, NOT FOR UPDATE SKIP LOCKED or LIMIT 1 — avoids false-negative wallet debits.
---

# Consuming aggregate "counter" rows under concurrency

Free-lead grants are aggregate counter rows (`provider_lead_grants.remainingCount` = 2/3/5),
a handful per provider. A free lead must be consumed BEFORE any wallet debit, so a
false negative (consume returns null while leads remain) wrongly charges the wallet.

**Rule:** to consume one unit from a small set of aggregate counter rows, lock the
ENTIRE eligible set with a plain blocking `SELECT ... FOR UPDATE` (NO `SKIP LOCKED`,
NO `LIMIT`), pick the target in application code (e.g. soonest-expiring), then do a
guarded decrement `UPDATE ... WHERE id = candidate AND remainingCount > 0 RETURNING`.

**Why not the obvious approaches:**
- `FOR UPDATE SKIP LOCKED`: a concurrent tx skips the one momentarily-locked grant
  row, finds no candidate, and returns null → false-negative wallet debit while a
  free lead still remains. SKIP LOCKED is for many-row queue draining, NOT for a
  tiny set of counters where every row matters.
- `ORDER BY ... LIMIT 1 FOR UPDATE`: EvalPlanQual recheck pitfall — if the single
  chosen row is decremented to 0 by a concurrent tx, the query can return zero rows
  even though another eligible row still exists. Removing `LIMIT` (lock the whole
  small set) sidesteps this; the blocked tx re-reads the committed state and picks
  the next still-eligible row.

**How to apply:** any "spend 1 from N small counter rows, must not false-negative"
path (grants, credits, allotments). Differs from queue/job patterns (many rows,
skip-locked is correct there).

# Downgrade revoke must be atomic with the tier flip

On premium→basic downgrade (Stripe webhook `customer.subscription.deleted` AND the
billing reconcile path), the tier flip and `revokeMonthlyPremiumGrants` must run in
ONE `db.transaction`. Otherwise there is a committed window where the provider reads
as basic but still has usable `premium_monthly` grants a concurrent offer can spend.
One-time grants (basic_signup / premium_activation) are intentionally preserved.

# Known pre-existing limitation (NOT introduced by free-lead work)

The Basic monthly lead cap (`canRespondToLead`) is checked OUTSIDE the offer
transaction while `incrementLeadUsage` runs inside it — a TOCTOU window lets
concurrent Basic offers slip a little past the 3/month cap. It is a soft anti-spam
cap (the provider still pays per lead), so it was left as-is. Close it with a
transactional check+increment if it ever needs to be a hard limit.
