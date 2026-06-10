---
name: Klard registration flow split
description: How Klard separates customer vs Berater (provider) signup, and the account-type chooser.
---

# Klard registration: customer vs Berater split

Klard has two distinct registration tracks that both use the same managed Clerk tenant.

- **Customer track**: navbar "Kostenlos registrieren" → Clerk `/sign-up` → `KontoTypWahl` at `/konto/willkommen` → user picks one of 7 account types.
- **Berater track**: public landing `/berater-werden` → `/sign-up?intent=berater` → `/provider/onboarding`.

**Why:** the two audiences need different post-signup destinations and different profile tables (immobilienKunde vs providers). Routing both through one generic onboarding caused confusion.

**How to apply:**
- The branch is driven by a `?intent=` query param read in `SignUpPage` (App.tsx). Compute the Clerk redirect URL **once** (useState initializer) and pass it to BOTH `forceRedirectUrl` and `fallbackRedirectUrl` — Clerk's own internal route changes otherwise re-read state. `intent=berater` → provider onboarding; anything else → `/konto/willkommen`.
- Account types live in `artifacts/klard/src/lib/kontoTypen.ts` (single source: KONTO_TYPEN, KONTO_TYP_VALUES, isCommercialTyp). 7 values: privat + 6 commercial. `privat` is the only non-commercial; it skips the portfolio section and routes to `/search` instead of `/gebaeudecheck`.
- `immobilienKunde.typ` is a `text` column — adding enum values only needs the OpenAPI spec (both ImmobilienKundeInput and ImmobilienKunde) + lib/db zod schema + codegen, NO db push/migration.
- Navbar provider-management items are gated by `hasProvider` from `useGetMyProviderProfile` (signed-in, retry:false, with explicit queryKey). A signed-in customer with no provider profile sees only "Berater werden".
