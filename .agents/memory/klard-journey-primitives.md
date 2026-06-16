---
name: Klard unified journey primitives
description: Shared UX primitives for consistent customer + provider journey in the klard frontend
---

# Klard unified journey primitives

The klard frontend has a shared set of journey UX primitives that are the canonical
way to render booking status, provider tier, payment status, steppers, empty states,
and onboarding headers. Do NOT re-declare local STATUS/tier/payment maps or ad-hoc
number-circle steppers in pages — import these instead.

- Terminology/state (no JSX): `artifacts/klard/src/lib/journey.ts` — tier labels, booking-status map, payment-badge labels/variants. Single source of truth; this is what killed the old "Top" premium-label drift.
- Components: `artifacts/klard/src/components/journey/` — `BookingStatusBadge` (StatusBadge.tsx), `VerifiedBadge`/`PremiumBadge`/`BasicBadge` (Badges.tsx, `size` prop sm|md), `PaymentBadge`, `Stepper`, `EmptyState`, `GuidedHeader` (onboarding header + optional embedded Stepper).

**Why:** Before this, each page hand-rolled its own status maps, tier pills, and step
circles, which drifted (e.g. "Top" vs "Premium"). Centralizing prevents future drift.

**How to apply:** Any new/edited klard page showing booking status, provider tier,
payment status, a multi-step flow, an empty list, or an onboarding header should consume
these primitives. Stepper label conventions: customer = Leistung·Termin·Bestätigung;
provider onboarding = Profil·Leistungen·Verfügbarkeit; commercial customer onboarding =
Kundenprofil·Gebäudecheck. `BeraterWerden` deliberately stays off `GuidedHeader` (it's a
marketing landing page with a hero, not an onboarding form shell).
