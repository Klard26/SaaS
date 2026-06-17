# Klard

Klard is a Doctolib-style booking marketplace for German consultants (Berater) — search, compare, and instantly book appointments with advisors across 12 professional categories. The repo hosts four frontend apps that share one backend + one Clerk tenant:

- **`@workspace/klard`** (`/`) — the customer marketplace (book Berater). Customer-role only.
- **`@workspace/klard-berater`** (`/berater/`) — the standalone provider/Berater app (own landing + sign-up, dashboard, services, availability, subscription). Provider-role only.
- **`@workspace/foerderportal`** (`/foerderschiene/`) — **Förderschiene**, a standalone Gebäudecheck + funding app (public Schnellcheck → report preview → paid PDF Gebäudereport, funding-program analysis, sanierungs cost estimates, and a paid Energieausweis order fulfilled by a certified Aussteller).
- **`@workspace/wattwechsel`** (`/wattwechsel/`) — a standalone Energiewechsel cockpit.

**Strict role separation**: one Clerk account is either Kunde OR Berater (same email = one role), tracked in `user_roles`. The customer app claims `customer`, the provider app claims `provider`; cross-role mutations (book / create provider) are rejected server-side. Existing providers were backfilled to role `provider`.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/klard run dev` — Klard customer frontend
- `pnpm --filter @workspace/klard-berater run dev` — Klard provider (Berater) frontend
- `pnpm --filter @workspace/foerderportal run dev` — Förderschiene frontend
- `pnpm --filter @workspace/wattwechsel run dev` — WattWechsel frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + Wouter routing
- API: Express 5 + Zod validation; DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (Replit-managed) · AI: Anthropic Claude (Replit AI proxy) · Payments: Stripe (connector) · Email: Resend (connector)
- API codegen: Orval (OpenAPI → React Query hooks + Zod schemas); server build: esbuild
- Calendar: hand-rolled iCal builder (RFC 5545), no external library

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/api-client-react/src/generated/` — generated hooks (`api.ts`) + types (`api.schemas.ts`)
- `lib/db/src/schema/` — Drizzle tables
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/klard/src/pages/` + `components/` — frontend pages and shared components

## Architecture decisions

- **Contract-first API**: OpenAPI spec is hand-written, then Orval codegen produces typed hooks + Zod schemas used for BOTH server validation and client consumption.
- **Clerk proxy**: Express middleware forwards `/clerk/*` to Clerk's CDN so the frontend uses a same-origin proxied Clerk JS URL.
- **Server-authoritative pricing**: client-supplied prices are always ignored; the server recomputes from the catalog by `serviceId` (rejects foreign/missing IDs).
- **Shared backend**: WattWechsel energie routes/schema stay in `api-server` + `lib/db`; both frontends call root-relative `/api/...` via the shared proxy and share the Clerk tenant (sessions carry across both apps).
- Frontend routing: Wouter with `BASE_URL` base path for the Replit proxy.

## Registration & account types

- **Customers**: after Clerk signup, go **straight to `/search`** — there is NO forced account-type chooser (the old `KontoTypWahl` / `/konto/willkommen` was removed). Booking creation needs no customer profile (it uses only the auth `customerId`). Commercial profile details are optional via Navbar "Mein Kundenkonto" → `/immobilien/onboarding`. The Gebäudecheck itself now lives in the standalone Förderschiene app (`/foerderschiene/`); customer-app links point there.
- **Berater**: public landing `/berater-werden` → signed-out CTA goes to `/sign-up?intent=berater`; `SignUpPage` reads `?intent=berater` and routes to `/provider/onboarding`.
- **Booking-intent preservation**: `AuthRoute` appends `?redirect=<location>` when bouncing signed-out users to sign-in; `SignInPage`/`SignUpPage` honor it and carry it across the sign-in↔sign-up link. `readRedirectParam()` (`App.tsx`) guards against open redirects (internal paths only). `SignedInHome` routes `/` → `/dashboard` if a provider profile exists, else `/search`.
- **Account types** (`artifacts/klard/src/lib/kontoTypen.ts`): `privat` + 6 commercial. `immobilienKunde.typ` is a `text` column, so adding values needs only spec + zod + codegen, no migration.

## Unified journey UX

- Shared journey primitives live in `artifacts/klard/src/lib/journey.ts` (terminology/state maps: tier labels, booking-status map, payment-badge labels/variants — single source of truth, no "Top" drift) and `artifacts/klard/src/components/journey/*` (`StatusBadge` → `BookingStatusBadge`, `Badges` → `VerifiedBadge`/`PremiumBadge`/`BasicBadge` with `size` sm|md, `PaymentBadge`, `Stepper`, `EmptyState`, `GuidedHeader`).
- Use these instead of re-declaring local STATUS maps, tier pills, ad-hoc number-circle steppers, or empty states. Stepper labels: customer flow = Leistung·Termin·Bestätigung; provider onboarding = Profil·Leistungen·Verfügbarkeit; commercial customer = Kundenprofil.
- `BeraterWerden` is intentionally NOT on `GuidedHeader` (it's a marketing landing page with its own hero).

## Product surfaces

- **Search** (`/search`): filter by city/ZIP, category, price; cards with ratings + Premium badges.
- **Provider Detail** (`/providers/:id`): Doctolib-style primary flow — Step 1 "Leistung wählen" → Step 2 "Termin wählen" (sticky slot picker) → `/booking/...`. AI Bedarfsanalyse + binding-offer builder live in a collapsible disclosure. Legal/tax categories show an RVG/StBVV direct-billing notice.
- **Booking / My Bookings**: confirmation with notes + iCal download; payment status badges, "Jetzt bezahlen" (Stripe) for billable bookings, reviews.
- **Provider Dashboard** (`/dashboard`): guided-setup status — green "Sie sind buchbar" once the provider has ≥1 service AND ≥1 open slot, else amber "Noch nicht buchbar" checklist (Profil / Leistungen / Verfügbarkeit / Auszahlung) with CTAs; pending-bookings highlight; tier badge, Premium upsell or iCal subscribe URL, stats.
- **Provider area**: Onboarding (auto-generates iCal token), Profile, Services CRUD, Availability calendar.
- **Pricing** (`/pricing`): Basic (free, 9% commission) vs Premium (89 €/month, 4% commission, AI tools, calendar sync, prioritized listing).

## Subscriptions, billing & Stripe Connect

- **Tiers**: `basic` (default) / `premium`, tracked on the `providers` row. Subscriptions via Stripe Checkout (`/providers/me/subscription/*`).
- **Booking payments**: categories with `requiresDirectBilling=true` (Steuerberater, Rechtsanwalt, Notar, Wirtschaftsprüfer) are excluded from Klard's payment flow per RVG/StBVV ("Direkt mit Berater"); all others pay via Stripe Checkout.
- **Connect (marketplace payouts)**: providers connect a Stripe Express account; booking checkout adds a destination-charge split (`application_fee_amount` + `transfer_data.destination`) ONLY when onboarded. Commission source of truth: `commission.ts` `effectiveCommissionRate()` (per-provider override, else tier default 0.04 / 0.09).
- **Stripe client** reads OAuth creds from the Replit connector; billing endpoints return `503` until the integration is authorized.
- **Webhook** (`/api/billing/webhook`): raw body BEFORE `express.json()`, signature-verified (never accepts unverified events). Handles subscription + booking `checkout.session.completed`, `customer.subscription.deleted`, `account.updated` (toggles `stripeOnboardedAt`), `payment_intent.payment_failed`.

## Binding offers (KI-Angebot)

- On ProviderDetail, customers select services, optionally generate an AI Bedarfsanalyse, accept the AGB, and bind the offer. Persisted in `offer_acceptances` via `POST /offers/accept` (auth). Pricing is server-authoritative. The `AGB_VERSION` constant is stored on each acceptance for proof and shown on the AGB page.

## Email (Resend)

- Client in `resendClient.ts` (never cached); send functions in `email.ts`. From address: connector `from_email` → `RESEND_FROM_EMAIL` → `onboarding@resend.dev`.
- **Branded `.hbs` templates** (`src/email-templates/`) are bundled into the esbuild output via a text loader, so they ship in dev AND prod. `renderTemplate()` does `{{key}}`/`{key}` substitution + HTML-escapes. Triggers cover welcome (provider/customer), booking confirmation/cancellation, payment confirmation, Premium activation, invoice-ready, 24h/1h reminders, payment-failed.
- **`email_log` table** records every send and powers dedupe via `wasEmailSent(templateId, relatedId)` (used for reminder idempotency). All sends are fire-and-forget.
- **Schedulers** (`reminderScheduler.ts`): 24h + 1h reminders, plus auto-complete (past bookings → `completed`, with an invoice safety-net for paid billable bookings).

## Calendar (iCal)

- **Provider feed** (Premium): `GET /providers/{id}/calendar.ics?token=` — subscribable feed of confirmed bookings; token auto-generated on provider creation.
- **Per-booking download** (all customers): `GET /bookings/{id}/calendar.ics`.
- **External import**: a provider's `externalIcalUrl` is polled (`icalSync.ts`, node-ical, every 15 min); busy events fill `blocked_slots`, which removes overlapping open slots from availability. The booking tx re-checks and rejects with `SLOT_BLOCKED` on a race.

## Authorization

- `GET /bookings/:id` — the booking's customer OR receiving provider only.
- `PATCH /bookings/:id/status` — customer may only `cancelled`; provider owner may set any status.
- `GET /providers/:id/bookings` — provider owner only.
- Booking creation validates `service.providerId` and `slot.providerId` match the path provider.

## Gebäudecheck / Förderschiene (`@workspace/foerderportal`, `/foerderschiene/`)

- **Standalone app** (extracted out of the Klard customer app). Shares the `/api` + `/clerk` proxy and Clerk tenant like WattWechsel. Klard now only links out to it (plain cross-artifact `<a href="/foerderschiene/">`); the energie components/`printReport.ts`/`@workspace/energie-calc`/leaflet deps were removed from `@workspace/klard`.
- Public checklist-style Schnellcheck (reuses `@workspace/energie-calc`) → report preview → per-report Stripe Checkout (49 €) for the detailed PDF Gebäudereport. Report extends with funding-program matching + Einzelmaßnahmen/Komplettsanierung cost estimates, and a guided paid Energieausweis order (Bedarfs/Verbrauch, 79 €/149 €) fulfilled by a certified Aussteller (NOT app-generated; status flow).
- **Server-authoritative pricing** (`foerderschiene.ts`): report + Energieausweis prices come from the server, client values ignored; ownership checks on reconcile; webhook fulfillment is idempotent, raw-body + signature-verified.
- Address autocomplete via Photon; Standort map via plain Leaflet + OSM (not react-leaflet, to avoid React 19 peer friction).
- **PDF export** (`printReport.ts`): opens a new top-level window, copies stylesheets + a `<base href>`, reveals hidden panels, and prints. **Why not `window.print()` directly:** the sandboxed preview iframe silently ignores it (no `allow-modals`); the new-window approach is a top-level context that works in preview and prod. Falls back to `window.print()` + a toast when the popup is blocked.

## Platform admin

- Allowlist via `ADMIN_CLERK_USER_IDS` (comma-separated, fail-closed). `requireAdmin` middleware in `adminAuth.ts`. `/admin/me` is open and tells the Navbar whether to show the admin menu; all other `/admin/*` endpoints are gated. Frontend at `/admin` (`Admin.tsx`).

## Account deletion

- One unified endpoint `DELETE /account/me` permanently deletes the user's entire account (provider + customer + Energiewechsel data + the Clerk login). Sequence: best-effort Stripe cancel → one DB transaction wiping every user-keyed table → `clerkClient.users.deleteUser`. DB deletes are idempotent so a failed Clerk delete is safely retryable (Clerk 404 = already gone = success). Frontend: `DeleteAccountSection.tsx` (type "LÖSCHEN" to confirm).

## WattWechsel (Energiewechsel)

- AI-assisted neutral Energiewechsel cockpit for the Wohnungswirtschaft, integrated into the same repo but its **own standalone frontend** (`@workspace/wattwechsel` at `/wattwechsel/`). German UI, no emojis, Klard light theme + green accents.
- **Demo boundary**: the live tariff feed (300+ suppliers) and actual supplier switch are a realistic DEMO (seed data + simulated state-machine transitions). Portfolio, vollmacht lifecycle, analyse/freigabe, and audit are fully functional.
- **Shared lib** `@workspace/energie-wechsel`: pure-TS state machines, tariff helpers, label maps, types. **DB** `lib/db/src/schema/energie.ts`; **API** `routes/energie.ts`. Demo portfolio seeds only when `DEMO_CLERK_USER_ID` is set; tariffs always seed.

## User preferences

_Populate as needed._

## Gotchas

- Run `pnpm run typecheck:libs` after any `lib/db/` schema change before typechecking `artifacts/api-server` (the DB lib must be rebuilt for exports to resolve).
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before building the frontend.
- Use `zod` (not `zod/v4`) in frontend pages passed to `zodResolver`.
- `deleteTimeSlot` mutation takes `{ params: { slotId } }`, not `{ id }`.
- Anthropic env vars are `ANTHROPIC_API_URL` and `ANTHROPIC_API_KEY` (set via Replit AI Integrations).

## Pointers

- See the `pnpm-workspace` skill for workspace structure and TypeScript setup.
- See the `clerk-auth` skill for Clerk customization guidance.
