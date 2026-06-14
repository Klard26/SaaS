---
name: Klard catalog & service-templates seed pipeline
description: How the Bau-/Gebäudeberater catalog flows from JSON into the DB and UI, and the gotchas around it.
---

# Catalog / service-templates pipeline

`scripts/data/klard-katalog.json` is the single source of truth (8 branches → service_categories → services). `scripts/src/seed.ts` reads it and seeds the `categories` table (one row per branch) plus the `service_templates` table (one row per service). The `/service-templates?category=<slug>` API returns all template columns via `select()`, consumed by the ProviderServices template picker.

**Why this matters:** there are TWO files that look like seeders. `scripts/src/seedServiceTemplates.ts` is STALE/dead — it hardcodes the old legal/tax category slugs and is NOT invoked by `seed.ts`. Always edit `seed.ts` + the JSON, never `seedServiceTemplates.ts`.

**How to apply (catalog changes):**
- Edit/replace `scripts/data/klard-katalog.json`, keep per-branch `qualifications` (seed.ts writes them into `categories.qualifications`; some imported catalogs omit them — merge them back or category pages regress).
- If service shape gains fields: extend `serviceTemplatesTable` (lib/db), then `pnpm run typecheck:libs`, then `pnpm --filter @workspace/db run push`.
- Mirror new fields in the OpenAPI `ServiceTemplate` schema and run `pnpm --filter @workspace/api-spec run codegen` so the client types pick them up.
- Reseed: `cd scripts && pnpm exec tsx src/seed.ts`.
- **Restart the api-server workflow after any lib/db schema change** — Drizzle's column set is loaded into the running process, so `select()` keeps returning the old columns until restart.

**Duration parsing:** the catalog `duration` is a human label (kept in `durationLabel`). `defaultDurationMinutes` is only a booking-slot fallback. `parseDuration()` handles minutes/hours(+decimals,ranges)/Halbtag/days precisely; project-scale lead-times (Wochen/Monate/Jahre/"projektbegleitend"/"individuell"/"Bauzeit") can't be a single slot and are clamped to PROJECT_SLOT_MINUTES (120).
