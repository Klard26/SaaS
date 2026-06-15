---
name: Klard registration flow split
description: How Klard separates customer vs Berater (provider) signup, and the account-type chooser.
---

# Klard registration: customer vs Berater split

Klard has two distinct registration tracks that both use the same managed Clerk tenant.

- **Customer track**: navbar "Kostenlos registrieren" → Clerk `/sign-up` → **straight to `/search`** (or a deep-link target). The forced 7-type `KontoTypWahl` chooser was REMOVED (Doctolib-style low friction). `KontoTypWahl` at `/konto/willkommen` still exists as a route but is orphaned — commercial profile is now optional via Navbar "Mein Kundenkonto" → `/immobilien/onboarding` or the Gebäudecheck flow.
- **Berater track**: public landing `/berater-werden` → `/sign-up?intent=berater` → `/provider/onboarding`.

**Why:** the two audiences need different post-signup destinations and different profile tables (immobilienKunde vs providers). Forcing customers through a 7-type chooser before they could book added friction with no functional need — **booking creation requires NO `immobilien_kunde` profile** (bookings.ts uses only the auth `customerId`), so the chooser was safe to remove.

**How to apply:**
- The branch is driven by a `?intent=` query param read in `SignUpPage` (App.tsx). Compute the Clerk redirect URL **once** (useState initializer) and pass it to BOTH `forceRedirectUrl` and `fallbackRedirectUrl` — Clerk's own internal route changes otherwise re-read state. `intent=berater` → provider onboarding; anything else → `/search` (or the `?redirect=` deep-link target).
- **Booking intent preservation**: `AuthRoute` appends `?redirect=<wouter location>` when bouncing signed-out users to `/sign-in`; `SignInPage`/`SignUpPage` honor it and carry it across the sign-in↔sign-up link. `readRedirectParam()` (App.tsx) is an open-redirect guard — accepts only single-leading-slash internal paths, rejects `//host`. Always route external/returned redirects through this guard.
- `SignedInHome` (replaces `HomeRedirect`) smart-routes `/`: has provider profile → `/dashboard`, else `/search`.
- Account types live in `artifacts/klard/src/lib/kontoTypen.ts` (single source: KONTO_TYPEN, KONTO_TYP_VALUES, isCommercialTyp). 7 values: privat + 6 commercial. `privat` is the only non-commercial; it skips the portfolio section and routes to `/search` instead of `/gebaeudecheck`.
- `immobilienKunde.typ` is a `text` column — adding enum values only needs the OpenAPI spec (both ImmobilienKundeInput and ImmobilienKunde) + lib/db zod schema + codegen, NO db push/migration.
- Navbar provider-management items are gated by `hasProvider` from `useGetMyProviderProfile` (signed-in, retry:false, with explicit queryKey). A signed-in customer with no provider profile sees only "Berater werden".
