import { db } from "@workspace/db";
import { providersTable, blockedSlotsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as nodeIcal from "node-ical";
import { logger } from "./logger";

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

let timer: NodeJS.Timeout | null = null;

/**
 * Returns true if an IP address belongs to a private, loopback, link-local,
 * unique-local or otherwise non-public range. Used to block SSRF — a provider
 * could otherwise point externalIcalUrl at internal/cloud-metadata endpoints.
 */
function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const p = ip.split(".").map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
    const [a, b] = p;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80") || lower.startsWith("fc") || lower.startsWith("fd"))
      return true;
    // IPv4-mapped IPv6 (::ffff:a.b.c.d)
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }
  return true; // unknown format → reject
}

/**
 * Validate a provider-supplied iCal URL and confirm its host does not resolve
 * to a private/internal address before we fetch it (SSRF guard).
 */
async function assertSafeFetchUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("INVALID_URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("INVALID_PROTOCOL");
  }
  const host = url.hostname;
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("PRIVATE_HOST");
    return url;
  }
  const results = await lookup(host, { all: true });
  if (results.length === 0) throw new Error("UNRESOLVABLE_HOST");
  for (const r of results) {
    if (isPrivateIp(r.address)) throw new Error("PRIVATE_HOST");
  }
  return url;
}

interface ParsedBusy {
  start: Date;
  end: Date;
  uid: string | null;
  summary: string | null;
}

/**
 * Parse an iCal payload into a list of busy intervals. Only VEVENTs with a
 * concrete start AND end are considered (all-day/duration-only events are
 * skipped to avoid blocking entire days unexpectedly).
 */
export function parseIcalBusy(icsText: string): ParsedBusy[] {
  const data = nodeIcal.sync.parseICS(icsText);
  const out: ParsedBusy[] = [];
  for (const key of Object.keys(data)) {
    const ev = data[key];
    if (!ev || ev.type !== "VEVENT") continue;
    const start = ev.start ? new Date(ev.start) : null;
    const end = ev.end ? new Date(ev.end) : null;
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) continue;
    if (end <= start) continue;
    out.push({
      start,
      end,
      uid: typeof ev.uid === "string" ? ev.uid : null,
      summary: typeof ev.summary === "string" ? ev.summary : null,
    });
  }
  return out;
}

/**
 * Fetch and re-sync a single provider's external iCal feed into blocked_slots.
 * Replaces all existing `source = 'ical'` rows for the provider with the
 * current feed contents (full refresh — simplest correct strategy for an
 * external read-only calendar). Returns the number of busy intervals stored.
 */
export async function syncProviderIcal(provider: {
  id: number;
  externalIcalUrl: string | null;
}): Promise<number> {
  if (!provider.externalIcalUrl) return 0;

  let safeUrl: URL;
  try {
    safeUrl = await assertSafeFetchUrl(provider.externalIcalUrl);
  } catch (err) {
    logger.warn(
      { err, providerId: provider.id },
      "External iCal URL rejected (SSRF guard)",
    );
    return 0;
  }

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 15_000);
  let icsText: string;
  try {
    const resp = await fetch(safeUrl, {
      signal: controller.signal,
      redirect: "error", // avoid redirect-based SSRF bypass
      headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.1" },
    });
    if (!resp.ok) {
      logger.warn(
        { providerId: provider.id, status: resp.status },
        "External iCal fetch failed",
      );
      return 0;
    }
    icsText = await resp.text();
  } catch (err) {
    logger.warn({ err, providerId: provider.id }, "External iCal fetch error");
    return 0;
  } finally {
    clearTimeout(to);
  }

  const busy = parseIcalBusy(icsText);

  await db.transaction(async (tx) => {
    await tx
      .delete(blockedSlotsTable)
      .where(
        and(
          eq(blockedSlotsTable.providerId, provider.id),
          eq(blockedSlotsTable.source, "ical"),
        ),
      );
    if (busy.length > 0) {
      await tx.insert(blockedSlotsTable).values(
        busy.map((b) => ({
          providerId: provider.id,
          startTime: b.start,
          endTime: b.end,
          source: "ical" as const,
          externalUid: b.uid,
          summary: b.summary,
        })),
      );
    }
  });

  return busy.length;
}

async function tick(): Promise<void> {
  try {
    const providers = await db
      .select({ id: providersTable.id, externalIcalUrl: providersTable.externalIcalUrl })
      .from(providersTable);
    const withFeed = providers.filter((p) => !!p.externalIcalUrl);
    if (withFeed.length === 0) return;

    let total = 0;
    for (const p of withFeed) {
      total += await syncProviderIcal(p);
    }
    logger.info({ providers: withFeed.length, intervals: total }, "Synced external iCal feeds");
  } catch (err) {
    logger.error({ err }, "iCal sync tick failed");
  }
}

export function startIcalSyncScheduler(): void {
  if (timer) return;
  // Kick off after 45s (after the reminder scheduler) so the server is ready.
  setTimeout(() => {
    void tick();
    timer = setInterval(() => void tick(), CHECK_INTERVAL_MS);
  }, 45_000);
  logger.info("External iCal sync scheduler scheduled (15 min)");
}
