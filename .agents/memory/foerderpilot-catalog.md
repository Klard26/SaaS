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
- `foerderpilotSetup.ts` runs once per process from `index.ts` startup. It runs
  the schema (DROP+CREATE) ONLY when `foerderpilot.programm` is absent, then ALWAYS
  runs import+antragspfade (both idempotent: ON CONFLICT / DELETE+INSERT).
  **Why always-run the data scripts:** self-heals a partial/aborted earlier load
  where the schema exists but data is missing. To fully re-seed: drop the schema, restart.

## Filter slug↔name gotcha
- The `v_programm_voll` view aggregates kategorie/zielgruppe DISPLAY NAMES
  (`k.name`, `zg.name`), but `/filter-optionen` and the frontend use SLUGS.
- So kategorie/zielgruppe filters must NOT compare against `ANY(vp.kategorien)`;
  resolve slugs via the junction tables (`programm_kategorie`→`kategorie.slug`,
  `programm_zielgruppe`→`zielgruppe.slug`) instead. Region filtering still uses the
  view array (regionen are enum text, not slugs).

## Frontend deviation
- Endpoints are mounted at `/api/foerderpilot/*` (distinct from existing
  `/api/foerderschiene/*`) and are NOT part of the Orval/OpenAPI contract, so the
  frontend (`foerderpilotApi.ts`) calls them with plain root-relative `fetch` —
  an intentional, documented deviation from the codegen workflow.
- Pages: `/foerderung` (Finder) + `/foerderung/:id` (Detail), in foerderportal.
