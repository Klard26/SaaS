---
name: Förderpilot funding catalog integration
description: How the imported Förderpilot funding catalog is wired into api-server + foerderportal, and its non-obvious gotchas.
---

# Förderpilot funding catalog

The Förderpilot funding catalog (65+ Förderprogramme) was imported as a standalone
Fastify backend and ported into the shared api-server + foerderportal frontend.

## Isolated schema, separate pool
- Data lives in its OWN Postgres schema `foerderpilot` (+ optional `energieausweis`),
  fully separate from the Drizzle `public` schema.
- It uses a DEDICATED `pg.Pool` (`lib/foerderpilotDb.ts`) that sets
  `search_path TO foerderpilot, energieausweis, public` on every connect.
- **Why:** changing search_path on the shared Drizzle pool would break every
  unqualified `public` query. Never reuse `@workspace/db`'s `pool` for this.

## SQL bundled + first-boot loader
- 3 SQL files (schema / 65-program import / antragspfade) live in
  `api-server/src/foerderpilot-sql/`, bundled via esbuild `".sql": "text"` loader
  (added alongside the existing `.hbs` loader in build.mjs).
- `foerderpilotSetup.ts` runs once per process from `index.ts` startup. It loads
  ONLY when the catalog is absent OR `programm` has 0 rows; if `programm` already
  has rows it SKIPS entirely.
  **Why not re-run the import each boot:** the import is one atomic txn and its
  `programm`/junction inserts are guarded, BUT `foerdergeber` has no unique key
  (its `ON CONFLICT DO NOTHING` only guards the serial PK), so repeated runs
  duplicate foerdergeber rows. Because the import is atomic, row count is reliably
  0 or complete — so "skip when >0" both avoids duplicates and self-heals an
  aborted load (which rolls back to 0). To fully re-seed: drop the schema, restart.

## Filter slug↔name gotcha
- The `v_programm_voll` view aggregates kategorie/zielgruppe DISPLAY NAMES
  (`k.name`, `zg.name`), but `/filter-optionen` and the frontend use SLUGS.
- So kategorie/zielgruppe filters (in BOTH the finder AND the `/match` endpoint)
  must NOT compare against `ANY(vp.kategorien)`/`ANY(vp.zielgruppen)`; resolve slugs
  via the junction tables (`programm_kategorie`→`kategorie.slug`,
  `programm_zielgruppe`→`zielgruppe.slug`) instead. Region filtering DOES use the
  view array (regionen are enum text values that match the slugs, not display names).
- **Region filter MUST OR `bundesweit`:** a region filter has to be
  `(<region> = ANY(vp.regionen) OR 'bundesweit' = ANY(vp.regionen))`, NOT exact
  membership. **Why:** nationwide (Bund) programs are tagged `bundesweit`, not per
  Bundesland; exact-match drops them, so picking a state would hide ~all Bund
  programs (energy catalog is ~35 Bund vs ~8 Länder). Both the Finder
  (`/programme`) and `/match` now do this — keep any new region-filtered query
  consistent.

## Frontend deviation
- Endpoints are mounted at `/api/foerderpilot/*` (distinct from existing
  `/api/foerderschiene/*`) and are NOT part of the Orval/OpenAPI contract, so the
  frontend (`foerderpilotApi.ts`) calls them with plain root-relative `fetch` —
  an intentional, documented deviation from the codegen workflow.
- Pages: `/foerderung` (Finder, with ebene/art/kategorie/zielgruppe/region filters),
  `/foerderung/:id` (Detail), and `/schnellcheck` (no-login profile → `POST /match`
  → result cards), all in foerderportal + linked from the Navbar.

## Vorgang/Dokument/Exposé extension (case management)
- A 4th SQL file extends the schema (Facilioo/PLANFLUX-style: organisation/objekt/vorgang/
  nachricht/dokument/expose + a `v_vorgang_uebersicht` view), depending on the base tables.
- Unlike the base catalog (skip-when-populated), the extension runs on EVERY boot via its own
  setup step — it is fully idempotent (IF NOT EXISTS / guarded enums / ADD COLUMN IF NOT
  EXISTS / CREATE OR REPLACE / seed guarded by `IF NOT EXISTS organisation`), so re-running
  self-heals a partial earlier run.
  **Why:** do NOT "optimize" it to skip-when-present — that reintroduces the partial-run
  hazard the base loader only avoids because its import is one atomic txn.
- Its routes (under `/api/foerderpilot/*`, plain fetch like the rest of the integration) are
  gated by `requireAdmin` (fail-closed).
  **Why:** they create/read PII + business data (Vorgänge, Nachrichten, Dokument-Metadaten,
  Exposés) and `foerderpilot.nutzer` has NO Clerk↔user mapping, so per-tenant ownership is
  impossible. Do NOT make these public; only relax once a real B2B2C role + ownership model
  exists. This is a deliberate deviation from the reference, whose endpoints were public.
