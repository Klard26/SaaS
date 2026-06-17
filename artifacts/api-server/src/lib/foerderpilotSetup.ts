import { foerderpilotPool, fpQueryOne } from "./foerderpilotDb";
import { logger } from "./logger";
// SQL bundled as text via the esbuild ".sql" loader (see build.mjs). Order matters:
// schema (creates the isolated foerderpilot schema) → import (65 programs) →
// antragspfade (guided application paths + rejection reasons).
import schemaSql from "../foerderpilot-sql/01_schema.sql";
import importSql from "../foerderpilot-sql/02_import.sql";
import antragspfadeSql from "../foerderpilot-sql/03_antragspfade.sql";

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
  } catch (err) {
    // Never let setup crash the server — the rest of the API stays available;
    // the Förderpilot routes will surface errors if the catalog is missing.
    didRun = false;
    logger.error({ err }, "[foerderpilot] Failed to load funding catalog.");
  }
}
