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

- **Homepage**: Hero search, platform stats, category grid, featured providers, how-it-works
- **Search** (`/search`): Filter providers by city/ZIP, category, price range; provider cards with ratings
- **Provider Detail** (`/providers/:id`): Full profile, service list, live slot picker, AI offer generator, reviews
- **Booking** (`/booking/:providerId/:serviceId/:slotId`): Confirmation page with notes
- **My Bookings** (`/bookings`): Upcoming/past bookings, leave reviews on completed bookings
- **Provider Dashboard** (`/dashboard`): Stats, booking management (confirm/cancel/complete), quick actions
- **Provider Onboarding** (`/provider/onboarding`): Register as a consultant
- **Provider Profile** (`/provider/profile`): Edit name, bio, city, contact info
- **Provider Services** (`/provider/services`): CRUD for services with price/duration
- **Provider Availability** (`/provider/availability`): Add/remove time slots calendar

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
