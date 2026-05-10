# Klard

Klard is a Doctolib-style booking marketplace for German consultants (Berater) — where users search, compare, and instantly book appointments with advisors across 12 professional categories.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/klard run dev` — run the frontend (port 26057)
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

## Product

- **Homepage**: Hero search, platform stats, category grid (34 fields), featured providers, how-it-works, dual CTA (free start / pricing)
- **Search** (`/search`): Filter providers by city/ZIP, category, price range; provider cards with ratings + Premium badges
- **Provider Detail** (`/providers/:id`): Full profile, Premium badge, RVG/StBVV direct-billing notice for legal/tax categories, service list, live slot picker, AI offer generator, reviews
- **Pricing** (`/pricing`): Basic (free, 9% commission) vs. Premium (89 €/month, 4% commission, AI tools, calendar sync, prioritized listing)
- **Booking** (`/booking/:providerId/:serviceId/:slotId`): Confirmation page with notes + post-booking iCal download
- **My Bookings** (`/bookings`): Upcoming/past bookings, payment status badges, "Jetzt bezahlen" (Stripe) for billable bookings, "Zum Kalender" iCal download, reviews
- **Provider Dashboard** (`/dashboard`): Tier badge, Premium upsell card OR iCal subscribe URL, stats, booking management
- **Provider Onboarding** (`/provider/onboarding`): Register as a consultant (auto-generates iCal token)
- **Provider Profile** (`/provider/profile`): Edit name, bio, city, contact info
- **Provider Services** (`/provider/services`): CRUD for services with price/duration
- **Provider Availability** (`/provider/availability`): Add/remove time slots calendar

## Subscriptions & Billing

- **Tiers**: `basic` (free, default) and `premium` (89 €/month). Tracked on `providers.subscriptionTier` + `stripeCustomerId` + `stripeSubscriptionId`.
- **Provider subscriptions**: Stripe Checkout via `POST /providers/me/subscription/checkout`. Status read via `GET /providers/me/subscription`. Cancel via `DELETE /providers/me/subscription`.
- **Booking payments**: Categories with `requiresDirectBilling=true` (Steuerberater, Rechtsanwalt, Notar, Wirtschaftsprüfer) are excluded from Klard's payment flow per RVG/StBVV — bookings show "Direkt mit Berater" and the billing endpoint refuses them. All other bookings can be paid via `POST /bookings/{id}/payment/checkout` (Stripe Checkout) and update `paymentStatus` (`pending`/`paid`/`failed`/`refunded`).
- **Stripe client**: `artifacts/api-server/src/lib/stripeClient.ts` reads OAuth credentials from the Replit Stripe connector. All billing endpoints return `503 Stripe nicht konfiguriert` until the user authorizes the integration in the Replit dashboard.
- **Webhook**: not yet wired — paymentStatus stays `pending` until the user finishes Stripe setup. Add `POST /billing/webhook` once the connector is live.

## Calendar Sync (iCal)

- **Provider feed** (Premium feature): `GET /providers/{id}/calendar.ics?token=<icalToken>` returns a subscribable iCal feed of all confirmed bookings. Token is auto-generated on provider creation and stored in `providers.icalToken`. Dashboard shows the full URL with a copy-link button for Premium providers.
- **Per-booking download** (all customers): `GET /bookings/{id}/calendar.ics` returns a single VEVENT for the booking owner. Exposed as a "Zum Kalender" download button in BookingConfirmation success screen and MyBookings cards.
- Implementation in `artifacts/api-server/src/routes/calendar.ts` — minimal iCal builder, no external library.

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
