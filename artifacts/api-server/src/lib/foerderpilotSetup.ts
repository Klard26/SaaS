import { foerderpilotPool, fpQueryOne } from "./foerderpilotDb";
import { logger } from "./logger";
// SQL bundled as text via the esbuild ".sql" loader (see build.mjs). Order matters:
// schema (creates the isolated foerderpilot schema) → import (65 programs) →
// antragspfade (guided application paths + rejection reasons).
import schemaSql from "../foerderpilot-sql/01_schema.sql";
import importSql from "../foerderpilot-sql/02_import.sql";
import antragspfadeSql from "../foerderpilot-sql/03_antragspfade.sql";
// Vorgangs-/Dokument-/Exposé-Erweiterung (Facilioo-/PLANFLUX-Muster). Extends the
// foerderpilot schema; fully idempotent (IF NOT EXISTS / guarded enums / CREATE
// OR REPLACE / guarded seed), so it runs every boot AFTER the base catalog exists.
import vorgangSql from "../foerderpilot-sql/04_vorgang.sql";

let didRun = false;

/**
 * Idempotently ensures the isolated Förderpilot funding catalog exists in the
 * connected database. Runs once per process and is guarded on schema existence
 * so it works in BOTH dev and production (each environment loads on first boot).
 *
 * Idempotency: the import script is a SINGLE atomic transaction. Its `programm`
 * + junction inserts ARE re-runnable (existence-guarded by titel / ON CONFLICT),
 * but `foerdergeber` has no unique key (its `ON CONFLICT DO NOTHING` only guards
 * the serial PK), so re-running would slowly DUPLICATE the foerdergeber rows. We
 * therefore load ONLY when the catalog is absent or empty:
 *   - table absent      → run schema (DROP+CREATE) + import + antragspfade.
 *   - table present, 0 rows → run import + antragspfade (schema already exists;
 *     a prior import that failed rolled back atomically, leaving 0 rows).
 *   - table present, >0 rows → skip (already loaded — avoids any duplication).
 * Because import is atomic, the row count is reliably either 0 or complete, so
 * this both avoids duplicates AND self-heals an aborted earlier load. To fully
 * re-seed, drop the `foerderpilot` schema and restart the server.
 */
export async function ensureFoerderpilotCatalog(): Promise<void> {
  if (didRun) return;
  didRun = true;

  try {
    await ensureBaseCatalog();
    await ensureVorgangExtension();
  } catch (err) {
    // Never let setup crash the server — the rest of the API stays available;
    // the Förderpilot routes will surface errors if the catalog is missing.
    didRun = false;
    logger.error({ err }, "[foerderpilot] Failed to load funding catalog.");
  }
}

/**
 * Loads the base funding catalog (schema + 65 programs + antragspfade). See the
 * idempotency notes above: loads only when the catalog table is absent or empty,
 * skips when already populated, and self-heals an atomically-aborted earlier load.
 */
async function ensureBaseCatalog(): Promise<void> {
  const existing = await fpQueryOne<{ reg: string | null }>(
    "SELECT to_regclass('foerderpilot.programm')::text AS reg",
  );

  let count = 0;
  if (existing?.reg) {
    const c = await fpQueryOne<{ n: string }>(
      "SELECT count(*)::text AS n FROM foerderpilot.programm",
    );
    count = Number(c?.n ?? 0);
  }

  if (existing?.reg && count > 0) {
    logger.info(
      { programme: count },
      "[foerderpilot] Catalog already populated — skipping load.",
    );
    return;
  }

  logger.info("[foerderpilot] Loading funding catalog…");
  const client = await foerderpilotPool.connect();
  try {
    if (!existing?.reg) {
      await client.query(schemaSql);
    }
    // Atomic import + idempotent antragspfade (DELETE+INSERT).
    await client.query(importSql);
    await client.query(antragspfadeSql);
  } finally {
    client.release();
  }

  const loaded = await fpQueryOne<{ n: string }>(
    "SELECT count(*)::text AS n FROM foerderpilot.programm",
  );
  logger.info(
    { programme: loaded?.n ?? "0" },
    "[foerderpilot] Funding catalog ready.",
  );
}

/**
 * Ensures the Vorgangs-/Dokument-/Exposé extension exists. Runs on every boot
 * AFTER the base catalog, because the extension SQL depends on base tables
 * (nutzer, berater, programm, pflichtunterlage, antragsschritt, bundesland).
 *
 * Safe to run unconditionally: the SQL is fully idempotent (CREATE TABLE IF NOT
 * EXISTS, guarded enum creation, ALTER ... ADD COLUMN IF NOT EXISTS, DROP TRIGGER
 * IF EXISTS, CREATE OR REPLACE VIEW, and a seed guarded by
 * `IF NOT EXISTS (SELECT 1 FROM organisation)`), so re-running self-heals a
 * partial earlier run without duplicating data. Guarded on the base schema so it
 * never runs against a missing foerderpilot.programm.
 */
async function ensureVorgangExtension(): Promise<void> {
  const base = await fpQueryOne<{ reg: string | null }>(
    "SELECT to_regclass('foerderpilot.programm')::text AS reg",
  );
  if (!base?.reg) {
    logger.warn(
      "[foerderpilot] Base catalog missing — skipping Vorgang/Exposé extension.",
    );
    return;
  }

  const client = await foerderpilotPool.connect();
  try {
    await client.query(vorgangSql);
  } finally {
    client.release();
  }
  logger.info("[foerderpilot] Vorgang/Exposé extension ready.");
}
