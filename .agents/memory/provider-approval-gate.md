---
name: Provider approval gate
description: How the admin Freigabe (approval) gate for Berater profiles is structured and the trap when gating public subresources.
---

# Provider admin-approval gate (Klard)

`providers.approvalStatus` is a text enum `pending|approved|rejected` (default
`pending`). It is a SEPARATE concept from `verified` (the trust badge) — never
conflate them. New providers start pending and are hidden from the marketplace
until an admin approves; approval makes the profile live automatically (there is
no separate provider "publish" step).

**Why a shared `canViewProvider` guard exists** (`api-server/src/lib/providerVisibility.ts`):
the provider's OWN dashboard/setup pages in `klard-berater`
(ProviderServices / ProviderAvailability / Dashboard) call the SAME public
endpoints `GET /providers/:id/{services,availability,reviews}` with their own
provider id while still pending. So you cannot simply filter these reads by
`approved` — that 404s the owner's own setup view. The guard returns true when
approved, else only for the authenticated owner (`clerkUserId`) or an admin
(`isAdminUserId`). Apply this same pattern to any NEW public provider subresource.

**Gate the writes too, not just reads:** non-approved providers must be rejected
(404) at booking creation (`bookings.ts`) AND `POST /offers/accept`
(`offers.ts`), mirroring the public-detail 404. A read-only gate is incomplete.

**Rejection lifecycle:** a `rejected` provider editing their profile
(`PATCH /providers/:id`) resets `approvalStatus`→`pending` (clears
rejectionReason/reviewedAt) so it re-enters the admin queue; an `approved`
profile is never un-published by edits.

**Known follow-ups (pre-existing, out of approval-gate scope):** provider-owned
mutations (services/availability POST/PATCH/DELETE) and `GET /dashboard/provider/:id`
lack owner/admin authorization. Public `Provider` DTO also carries
approvalStatus/rejectionReason/reviewedAt (always null/approved publicly — no
real leak, but inconsistent with "no public rejectionReason").
