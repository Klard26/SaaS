# Klard

Klard is a Doctolib-style booking marketplace for German consultants (Berater) — where users search, compare, and instantly book appointments with advisors across 12 professional categories.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/klard run dev` — run the Klard frontend (port 26057)
- `pnpm --filter @workspace/wattwechsel run dev` — run the WattWechsel frontend (port 18607)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + Wouter routing
- API: Express 5 + Zod validation
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (managed by Replit) via `@clerk/react` + `@clerk/express`
- AI: Anthropic Claude (via Replit AI Integrations proxy) for AI offer generation
- Payments: Stripe (via Replit-managed connector) for premium subscriptions + booking payments
- Email: Resend (via Replit-managed connector) for transactional emails
- Calendar: hand-rolled iCal feed builder (RFC 5545), no external library
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for API contract (19 endpoints)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-client-react/src/generated/api.schemas.ts` — generated TypeScript types
- `lib/db/src/schema/` — Drizzle table definitions (categories, providers, services, timeSlots, bookings, reviews)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/klard/src/pages/` — all frontend pages
- `artifacts/klard/src/components/` — shared components (Navbar, shadcn/ui)

## Architecture decisions

- Contract-first API: OpenAPI spec is written manually, then Orval codegen produces typed hooks and Zod schemas for both server validation and client consumption.
- Clerk proxy middleware on the Express server forwards `/clerk/*` requests to Clerk's CDN, allowing the frontend to use a proxied Clerk JS URL for same-origin auth flows.
- AI offers use Replit-managed Anthropic integration — no user API key required; billed to Replit credits.
- All DB tables use Drizzle's `pgTable` with timestamps and Zod schemas via `drizzle-zod`.
- Frontend routing: Wouter (lightweight) with `BASE_URL` base path support for the Replit proxy architecture.

## Registration & Account Types

- **Two separate registration tracks**:
  - **Customers** ("Einloggen" / "Kostenlos registrieren" in the navbar): after Clerk signup, customers go **straight to `/search`** (Doctolib-style — NO forced account-type chooser). If they started a booking while signed out, `AuthRoute` appends `?redirect=<location>` so they land back on the exact booking/target URL after auth. `SignInPage`/`SignUpPage` honor `?redirect=` and carry it across the sign-in↔sign-up link. `readRedirectParam()` (in `App.tsx`) is an open-redirect guard: it only accepts internal paths (single leading slash, rejects `//host`). `KontoTypWahl.tsx` (`/konto/willkommen`) still exists but is **orphaned** (no longer forced) — commercial profile details are now optional via Navbar "Mein Kundenkonto" → `/immobilien/onboarding` or the Gebäudecheck flow. `SignedInHome` (replaces `HomeRedirect`) smart-routes `/`: provider profile → `/dashboard`, else `/search`.
  - **Berater (providers)**: dedicated public landing `/berater-werden` (`BeraterWerden.tsx`). CTA routes signed-in users to `/provider/onboarding`, signed-out to `/sign-up?intent=berater`. `SignUpPage` reads `?intent=berater` and force-redirects to `/provider/onboarding`.
- **Account types** (`artifacts/klard/src/lib/kontoTypen.ts`): `privat`, `hausverwaltung`, `makler`, `bestandshalter`, `bautraeger`, `genossenschaft`, `gewerbe`. `isCommercialTyp()` = all except `privat`. The `immobilienKunde.typ` enum (OpenAPI `ImmobilienKundeInput`/`ImmobilienKunde` + `lib/db` zod) carries all 7; `typ` is a `text` column so adding values needs no migration.
- **ImmobilienKundeOnboarding** (`/immobilien/onboarding`): 7-type select, reads `?typ=` to preselect, adaptive firma label ("Ihr Name" for privat, "Firma" otherwise) + heading, portfolio section (anzahlGebaeude/wohneinheiten) hidden and forced null for `privat`. Privat saves → `/search`, commercial → `/gebaeudecheck`.
- **Navbar dropdown** splits customer items (Meine Buchungen, Mein Kundenkonto → `/immobilien/onboarding`) from Berater items, which appear only when a provider profile exists (`useGetMyProviderProfile`, `hasProvider = !!providerProfile?.id`); otherwise a single "Berater werden" entry.

## Product

- **Homepage**: Hero search, platform stats, category grid (34 fields), featured providers, how-it-works, dual CTA (free start / pricing)
- **Search** (`/search`): Filter providers by city/ZIP, category, price range; provider cards with ratings + Premium badges
- **Provider Detail** (`/providers/:id`): Doctolib-style primary flow — numbered Step 1 "Leistung wählen" (service list) → Step 2 "Termin wählen" (sticky sidebar live slot picker) → direct navigate to `/booking/...` (`AuthRoute` handles auth + return). Full profile, Premium badge, RVG/StBVV direct-billing notice for legal/tax categories. The AI Bedarfsanalyse + binding-offer builder is demoted into a collapsible disclosure (`showOfferBuilder` toggle, `button-toggle-offer-builder`). Reviews below.
- **Pricing** (`/pricing`): Basic (free, 9% commission) vs. Premium (89 €/month, 4% commission, AI tools, calendar sync, prioritized listing)
- **Booking** (`/booking/:providerId/:serviceId/:slotId`): Confirmation page with notes + post-booking iCal download
- **My Bookings** (`/bookings`): Upcoming/past bookings, payment status badges, "Jetzt bezahlen" (Stripe) for billable bookings, "Zum Kalender" iCal download, reviews
- **Provider Dashboard** (`/dashboard`): Guided-setup status — a green "Sie sind buchbar" banner once the provider has ≥1 service AND ≥1 open slot, OR an amber "Noch nicht buchbar" checklist (Profil / Leistungen / Verfügbarkeit / Auszahlung[optional], each with a direct CTA + done/X count). Pending-bookings highlight banner when `pendingCount > 0`. Plus tier badge, Premium upsell card OR iCal subscribe URL, stats, booking management. Bookable status uses `useListProviderServices` + `useListAvailability`; payout is `connect.onboarded`.
- **Provider Onboarding** (`/provider/onboarding`): Register as a consultant (auto-generates iCal token)
- **Provider Profile** (`/provider/profile`): Edit name, bio, city, contact info
- **Provider Services** (`/provider/services`): CRUD for services with price/duration
- **Provider Availability** (`/provider/availability`): Add/remove time slots calendar

## Subscriptions & Billing

- **Tiers**: `basic` (free, default) and `premium` (89 €/month). Tracked on `providers.subscriptionTier` + `stripeCustomerId` + `stripeSubscriptionId`.
- **Provider subscriptions**: Stripe Checkout via `POST /providers/me/subscription/checkout`. Status read via `GET /providers/me/subscription`. Cancel via `DELETE /providers/me/subscription`.
- **Booking payments**: Categories with `requiresDirectBilling=true` (Steuerberater, Rechtsanwalt, Notar, Wirtschaftsprüfer) are excluded from Klard's payment flow per RVG/StBVV — bookings show "Direkt mit Berater" and the billing endpoint refuses them. All other bookings can be paid via `POST /bookings/{id}/payment/checkout` (Stripe Checkout) and update `paymentStatus` (`pending`/`paid`/`failed`/`refunded`).
- **Stripe client**: `artifacts/api-server/src/lib/stripeClient.ts` reads OAuth credentials from the Replit Stripe connector. All billing endpoints return `503 Stripe nicht konfiguriert` until the user authorizes the integration in the Replit dashboard.
- **Webhook**: `POST /api/billing/webhook` mounted with raw body BEFORE `express.json()`. Verifies signature with `STRIPE_WEBHOOK_SECRET` (returns 503 if unset, 400 if signature missing/invalid — never accepts unverified events). Handles `checkout.session.completed` (subscription + booking metadata) and `customer.subscription.deleted`.

## Binding Offers (KI-Angebot)

- **What**: On ProviderDetail, customers build a branded offer by selecting services (live net/USt/brutto totals), optionally generate an AI Bedarfsanalyse, accept the AGB, and bind the offer rechtsverbindlich. Persisted via `offer_acceptances` table.
- **Endpoints**: `POST /offers/accept` (auth) and `GET /offers/mine` (auth) in `artifacts/api-server/src/routes/offers.ts`. Both return 401 unauthenticated.
- **Server-authoritative pricing**: client-supplied prices are IGNORED. The accept route requires each item to carry a `serviceId` belonging to the provider, fetches services from the catalog, and recomputes net/USt/brutto + totals server-side (net derived from gross via `vatRate` when `netPrice` is null). Rejects (400) on missing/foreign serviceIds.
- **AGB version**: `AGB_VERSION` constant (currently `2026-06`) is sent from ProviderDetail and stored on each acceptance for proof; the AGB page shows the same version.

## Gebäudecheck address + map + report

- **Address autocomplete**: `AddressAutocomplete.tsx` uses Photon (photon.komoot.io), debounced 300ms, DE-filtered; autofills strasse/hausnummer/plz/city/lat/lng into EnergieVollanalyse. `BuildingInput` (lib/energie-calc) carries optional strasse/hausnummer/lat/lng.
- **Standort map**: `StandortMap.tsx` uses plain Leaflet + OSM tiles (not react-leaflet, to avoid React 19 peer friction). Shown in a "Standort" tab.
- **Report**: `ReportPreviewDemo.tsx` is an A4-styled sample report shown on `/gebaeudecheck` to all users; the real unlocked report exports as PDF via `printReport()` (`artifacts/klard/src/lib/printReport.ts`). It opens a new top-level window, copies the page's stylesheets (`<style>` dev + `<link rel=stylesheet>` prod) plus a `<base href>`, reveals hidden tab panels, hides interactive chrome, and prints from there. **Why not direct `window.print()`:** Replit's sandboxed preview iframe silently ignores `window.print()` (no `allow-modals`); the new-window approach is a top-level context so it works in preview and production. Falls back to `window.print()` + a "Pop-up blockiert" toast when the popup is blocked. The `@media print` rules in index.css (`.print-area`, `.no-print`) still apply.

## Authorization

- `GET /bookings/:id` — customer who booked OR provider receiving the booking; otherwise 403.
- `PATCH /bookings/:id/status` — customer can only `cancelled`; provider owner can set any status; otherwise 403.
- `GET /providers/:id/bookings` — only the provider owner; otherwise 403.
- Booking creation validates `service.providerId === providerId` and `slot.providerId === providerId` to prevent cross-provider tampering.

## Email Notifications

- **Provider**: Resend via Replit connector. Client in `artifacts/api-server/src/lib/resendClient.ts` (never cached). Send functions in `artifacts/api-server/src/lib/email.ts`.
- **From address**: connector's `from_email`, fallback `RESEND_FROM_EMAIL`, default `Klard <onboarding@resend.dev>`. To send from `noreply@klard.de`, verify the domain in Resend (DNS records) and set the verified address as `RESEND_FROM_EMAIL`.
- **Branded HTML templates**: live in `artifacts/api-server/src/email-templates/*.hbs` (Energy Impuls GmbH branding — navy/teal/cream, no Handlebars block helpers, only `{{var}}` substitution). Bundled into the esbuild output via a `.hbs` text loader (`build.mjs`) + `*.hbs` module declaration, so they ship in BOTH dev and prod (dev = build && start, no runtime file reads). `renderTemplate()` in `email.ts` replaces both `{{key}}` and `{key}` (some templates have single-brace typos), HTML-escapes values, then strips any leftover `{{...}}`. Legacy inline `legacyWrap()` HTML is retained only for `sendProviderAssessmentSaved` and Stornorechnungen (no dedicated templates for those).
- **Triggers** (template → event):
  - `welcome_provider` on `POST /providers` (provider's Clerk email).
  - `welcome_customer` on first-time `PUT /immobilien-kunde/me` (new customer profile; email from form or Clerk).
  - `booking_confirmation_customer` to customer (with `.ics` attachment) + `booking_confirmation_provider` (with payout/commission by tier) to provider on `POST /bookings`.
  - `booking_cancelled_by_customer` (to provider + customer) or `booking_cancelled_by_provider` (to customer only) on `PATCH /bookings/:id/status` → `cancelled`.
  - `booking_confirmation_customer` (paid variant) as the payment confirmation in the Stripe webhook on `checkout.session.completed` (kind=booking, status=paid).
  - `stripe_activated` to provider on `checkout.session.completed` (kind=subscription) when Premium activates.
  - `invoice_ready` (with PDF attachment) on invoice issuance; Stornorechnungen still use `legacyWrap()`.
  - `booking_reminder_24h` and `booking_reminder_1h` via in-process scheduler (`reminderScheduler.ts`); both deduped via the `email_log` table (`wasEmailSent`), not the legacy single `reminderSentAt` flag.
  - `payment_failed` on the `payment_intent.payment_failed` Stripe webhook.
  - `invoice_ready` also issued by the scheduler's auto-complete safety-net for paid billable bookings without an invoice.
- **Unwired templates** (provided but no trigger yet): `profile_activated` (has an emoji and no distinct "profile published" event — `welcome_provider` already covers provider creation).
- All sends are fire-and-forget (`void`) so a Resend outage never blocks the API response. Failures are logged.

## Calendar Sync (iCal)

- **Provider feed** (Premium feature): `GET /providers/{id}/calendar.ics?token=<icalToken>` returns a subscribable iCal feed of all confirmed bookings. Token is auto-generated on provider creation and stored in `providers.icalToken`. Dashboard shows the full URL with a copy-link button for Premium providers.
- **Per-booking download** (all customers): `GET /bookings/{id}/calendar.ics` returns a single VEVENT for the booking owner. Exposed as a "Zum Kalender" download button in BookingConfirmation success screen and MyBookings cards.
- Implementation in `artifacts/api-server/src/routes/calendar.ts` — minimal iCal builder, no external library.

## External iCal import + availability blocking

- **What**: A provider sets `providers.externalIcalUrl` (e.g. Google/Outlook public `.ics`) in Profil bearbeiten. Busy events from that feed are imported into the `blocked_slots` table and automatically remove overlapping time slots from their public availability.
- **Schema**: `lib/db/src/schema/blockedSlots.ts` — `blocked_slots` (providerId FK cascade, startTime/endTime, source default `ical`, externalUid, summary). Indexed on `(providerId)` and `(providerId, startTime, endTime)`.
- **Sync service**: `artifacts/api-server/src/lib/icalSync.ts` uses `node-ical` (^0.26.1). `parseIcalBusy()` extracts busy VEVENTs; `syncProviderIcal()` does a full-refresh (deletes the provider's `source=ical` blocked slots, re-inserts current ones); `startIcalSyncScheduler()` polls every 15 min for all providers with a non-null `externalIcalUrl`.
- **Availability filtering**: `routes/availability.ts` excludes any open time slot overlapping a blocked slot. `routes/bookings.ts` booking tx re-checks and rejects with `SLOT_BLOCKED` if the chosen slot now overlaps a blocked range (prevents race with a freshly-synced calendar).
- **Frontend**: ProviderProfile has an "Externer Kalender (iCal-URL)" field (URL-validated, empty clears to null). PATCH handler maps `externalIcalUrl || null`.

## Stripe Connect (marketplace payouts)

- **What**: Providers connect a Stripe Express account to receive booking payments directly, minus the platform commission. Destination-charge split on each booking checkout.
- **Provider fields** (`lib/db` providers): `stripeAccountId`, `stripeOnboardedAt` (null until onboarding complete), `commissionRate` (numeric(4,3), NULLABLE — per-provider override).
- **Commission**: `artifacts/api-server/src/lib/commission.ts` — `effectiveCommissionRate(provider)` returns `provider.commissionRate` if set (0 ≤ r < 1), else tier default (`tierCommissionRate`: premium 0.04, basic 0.09). Same source of truth as the pricing page.
- **Endpoints** (`routes/connect.ts`): `GET /providers/me/connect` (status: hasAccount/onboarded/chargesEnabled/payoutsEnabled/detailsSubmitted, live from `accounts.retrieve`, keeps `stripeOnboardedAt` in sync); `POST /providers/me/connect/onboard` (creates Express account if needed + returns `accountLinks` onboarding URL; return_url `/dashboard?connect=return`, refresh_url `/dashboard?connect=refresh`). Both 401 unauthenticated, 503 if Stripe not connected.
- **Payment split**: `routes/billing.ts` booking checkout adds `application_fee_amount` (commission) + `transfer_data.destination` (provider's `stripeAccountId`) ONLY when the provider is onboarded. The split object is spread inline (`...splitData`) — no explicit Stripe type (v22.1.1 `PaymentIntentData` type not usefully exported). `payment_intent_data.metadata` carries `{bookingId, kind}`.
- **Webhook** (`routes/webhook.ts`): `account.updated` sets/clears `stripeOnboardedAt` (no email — `profile_activated.hbs` has an emoji); `payment_intent.payment_failed` sets `paymentStatus=failed` + sends `payment_failed` email.
- **Frontend**: Dashboard shows a Stripe Connect payout card — "Auszahlungskonto einrichten" (onboard CTA) or "Auszahlungskonto aktiv" once onboarded. Refreshes status on `?connect=return|refresh`.

## Email logging + extended scheduler

- **email_log table** (`lib/db/src/schema/emailLog.ts`): every `send()` in `email.ts` persists a row (`templateId`, `recipient`, `relatedId`, `subject`, `status` sent/failed, `error`). Indexed on `(templateId, relatedId)` for dedupe and `(sentAt)`. `wasEmailSent(templateId, relatedId)` helper checks if a send already happened (used for reminder idempotency). ALL `send*` calls pass `templateId`/`relatedId`.
- **1h reminder + auto-complete** (`reminderScheduler.ts`): `send24hReminders` + `send1hReminders` (each deduped via `wasEmailSent`, using `booking_reminder_24h` / `booking_reminder_1h` templates) + `autoCompleteBookings` (joins `timeSlots`, sets bookings with `endTime < now` to `completed`; idempotent invoice safety-net issues `invoice_ready` for paid billable bookings not yet invoiced).
- **payment_failed email**: `sendPaymentFailed()` triggered from the `payment_intent.payment_failed` webhook.

## Platform Admin

- **Allowlist**: `ADMIN_CLERK_USER_IDS` env var (comma-separated Clerk user IDs). Empty/unset → no admin access (fail-closed).
- **Auth helper**: `artifacts/api-server/src/lib/adminAuth.ts` — `requireAdmin` middleware (401 unsigned / 403 non-admin); `isAdminUserId()` for ad-hoc checks.
- **Endpoints** (all gated by `requireAdmin` except `/admin/me`):
  - `GET /admin/me` — open; returns `{isAdmin: boolean}` for current session. Used by Navbar to conditionally show the "Plattform-Admin" menu item.
  - `GET /admin/stats` — global counts/revenue across bookings, providers, customers, reviews, invoices.
  - `GET /admin/timeseries?days=` — daily bookings + paid revenue (1–365 days).
  - `GET /admin/providers` — all providers with `bookingCount`, `paidRevenueCents`, `distinctCustomers`.
  - `GET /admin/customers` — distinct customers (by `bookings.customerId`) with aggregates.
  - `GET /admin/bookings?limit=&status=` — recent bookings; validates `status` against the enum (400 on invalid).
  - `GET /admin/categories` — category breakdown.
- **Frontend**: `/admin` page (`artifacts/klard/src/pages/Admin.tsx`) with tabs (Übersicht, Buchungen, Anbieter, Kunden, Kategorien). German status/payment labels via `STATUS_LABELS` / `PAYMENT_LABELS`.

## Account Deletion (Konto löschen)

- **What**: Self-service permanent account deletion for both roles via ONE unified endpoint `DELETE /account/me` (`artifacts/api-server/src/routes/account.ts`, operationId `deleteMyAccount`, tag `account`). 401 unauthenticated. Deletes the user's ENTIRE account: provider + customer + Energiewechsel data + the Clerk login itself.
- **Sequence**: best-effort Stripe `subscriptions.cancel` (outside tx, never blocks) → single DB transaction deleting provider-owned `services`/`time_slots`/`reviews`/`bookings` + provider row (cascades `blocked_slots`/`invoices`), all user-keyed data (`reviews`/`bookings` by `customerId=userId`, `immobilien_kunde`, `offer_acceptances`, `assessments`, `gebaeudecheck_orders`, `gebaeudecheck_credits`), and `verwalter` (cascades the whole Energiewechsel portfolio) → `clerkClient.users.deleteUser(userId)`.
- **Retry-safety**: DB deletes are idempotent; if the final Clerk deletion fails (non-404) the route returns 500 and the client can safely retry (data already gone, only the Clerk delete re-runs). Clerk 404 = already deleted, treated as success.
- **Frontend**: `DeleteAccountSection.tsx` (danger-zone Card + AlertDialog, type "LÖSCHEN" to confirm) calls `useDeleteMyAccount` → `queryClient.clear()` → Clerk `signOut`. Rendered on `/provider/profile` (variant "Berater-Konto") and always on `/immobilien/onboarding` (variant "Kundenkonto").

## WattWechsel (Energiewechsel)

- **What**: AI-assisted neutral Energiewechsel cockpit for the Wohnungswirtschaft (Hausverwalter/Bestandshalter), integrated into Klard. German UI, no emojis, Klard light look + green energy accents (CSS vars `--klard-green` / `--klard-green-l`).
- **Demo boundary**: External parts (live tariff feed for 300+ suppliers + actual supplier switch) are a realistic DEMO — seed data (`scripts/src/seedEnergie.ts`, `seed:energie`) plus simulated state-machine transitions. Everything else (portfolio, vollmacht lifecycle, analyse/freigabe, audit) is fully functional.
- **Shared lib**: `@workspace/energie-wechsel` — pure-TS state machines (`vollmachtUebergangErlaubt`, `wechselUebergangErlaubt`, `nachEmpfehlung`), tariff comparison helpers, label maps (SPARTE_LABELS, VOLLMACHT_*, WECHSEL_STATUS_LABELS, ZAEHLER_ART_LABELS), and types.
- **DB**: `lib/db/src/schema/energie.ts` — verwalter, objekt, zaehlpunkt, vertrag, vollmacht, wechselvorgang, auditLog, tarifAngebot.
- **API**: `artifacts/api-server/src/routes/energie.ts` — verwalter onboarding/me, portfolio KPI+tree, objekt/zaehlpunkt/vertrag CRUD, vollmacht CRUD+lifecycle, wechsel analyse (Claude recommendation + real calc, simulated completion)/freigeben/ablehnen/widersprechen, audit list, tarife list.
- **Frontend**: WattWechsel is its OWN standalone frontend artifact `@workspace/wattwechsel` at `/wattwechsel/` (NOT part of Klard). Routes: `/` (public EnergieLanding), `/onboarding` + `/portfolio` (behind AuthRoute), `/sign-in` + `/sign-up`. Cockpit tabs in `artifacts/wattwechsel/src/components/energie/`: Übersicht, Portfolio, Vollmachten, Wechsel, Audit, Tarife. Own WattWechsel-branded Navbar/Footer (green accents); copies Klard's `index.css` theme verbatim.
- **Shared login**: WattWechsel replicates Klard's Clerk block (same managed Clerk tenant via repl-level `VITE_CLERK_PUBLISHABLE_KEY` / `VITE_CLERK_PROXY_URL`) → same user accounts; sessions carry across both apps in the same browser.
- **Shared backend**: energie routes STAY in `api-server` and energie schema STAYS in `lib/db`; codegen/clients unchanged. The generated API client calls root-relative `/api/...`, so requests from `/wattwechsel/*` reach the same backend via the shared proxy.
- **Run**: `pnpm --filter @workspace/wattwechsel run dev` (port 18607).
- **Demo portfolio** seeds only when `DEMO_CLERK_USER_ID` is set; tariffs always seed.

## User preferences

_Populate as needed._

## Gotchas

- Run `pnpm run typecheck:libs` after any schema change in `lib/db/` before typechecking `artifacts/api-server` — the DB lib must be rebuilt for exports to resolve.
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before building the frontend.
- Use `zod` (not `zod/v4`) in frontend pages when passing to `zodResolver` from `@hookform/resolvers/zod`.
- `deleteTimeSlot` mutation takes `{ params: { slotId } }` not `{ id }` — matches the `DeleteTimeSlotParams` generated type.
- The Anthropic env vars are `ANTHROPIC_API_URL` and `ANTHROPIC_API_KEY` (set via Replit AI Integrations).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk customization guidance
