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
 * The schema script does a `DROP SCHEMA foerderpilot CASCADE`, so it is only run
 * when the `foerderpilot.programm` table is absent. The import + antragspfade
 * scripts are fully idempotent (ON CONFLICT / DELETE+INSERT), so they are run on
 * every first process boot — this self-heals a partial/aborted earlier load
 * where the schema exists but data is missing or incomplete. To fully re-seed,
 * drop the `foerderpilot` schema and restart the server.
 */
export async function ensureFoerderpilotCatalog(): Promise<void> {
  if (didRun) return;
  didRun = true;

  try {
    const existing = await fpQueryOne<{ reg: string | null }>(
      "SELECT to_regclass('foerderpilot.programm')::text AS reg",
    );

    const client = await foerderpilotPool.connect();
    try {
      // Schema (DROP+CREATE) only when the catalog table is absent.
      if (!existing?.reg) {
        logger.info("[foerderpilot] Creating funding catalog schema…");
        await client.query(schemaSql);
      }
      // Idempotent data load — safe (and self-healing) to run on every boot.
      await client.query(importSql);
      await client.query(antragspfadeSql);
    } finally {
      client.release();
    }

    const count = await fpQueryOne<{ n: string }>(
      "SELECT count(*)::text AS n FROM foerderpilot.programm",
    );
    logger.info(
      { programme: count?.n ?? "0" },
      "[foerderpilot] Funding catalog ready.",
    );
  } catch (err) {
    // Never let setup crash the server — the rest of the API stays available;
    // the Förderpilot routes will surface errors if the catalog is missing.
    didRun = false;
    logger.error({ err }, "[foerderpilot] Failed to load funding catalog.");
  }
}
