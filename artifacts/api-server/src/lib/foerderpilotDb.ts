import pg from "pg";

const { Pool } = pg;

/**
 * Dedicated connection pool for the imported "Förderpilot" funding catalog.
 *
 * The Förderpilot data lives in its own isolated `foerderpilot` (+ optional
 * `energieausweis`) Postgres schema, kept fully separate from the Drizzle
 * `public` schema. We therefore use a SEPARATE pool whose connections set the
 * search_path to those schemas — changing the search_path on the shared Drizzle
 * pool would break every unqualified `public` query.
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for the Förderpilot pool.");
}

export const foerderpilotPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
});

foerderpilotPool.on("connect", (client) => {
  // energieausweis references foerderpilot tables, so both schemas are on the path.
  client.query("SET search_path TO foerderpilot, energieausweis, public");
});

foerderpilotPool.on("error", (err) => {
  // A pool-level connection error must never crash the process.
  // eslint-disable-next-line no-console
  console.error("[foerderpilot-db] Unexpected pool error:", err.message);
});

/** Typed multi-row query helper. */
export async function fpQuery<T = unknown>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await foerderpilotPool.query(text, params);
  return res.rows as T[];
}

/** Typed single-row query helper (or null). */
export async function fpQueryOne<T = unknown>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await fpQuery<T>(text, params);
  return rows[0] ?? null;
}
