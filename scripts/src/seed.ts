import {
  db,
  categoriesTable,
  providersTable,
  servicesTable,
  bookingsTable,
  reviewsTable,
  timeSlotsTable,
  serviceTemplatesTable,
} from "@workspace/db";
import { sql, inArray, notInArray } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CatalogService {
  name: string;
  price_type: "fix" | "hr" | "pa" | "hoai" | "on";
  duration: string;
  p_min?: number | null;
  p_avg?: number | null;
  p_max?: number | null;
  unit?: string | null;
  inputs?: string[];
  fundable?: string | null;
  notes?: string | null;
}
interface CatalogServiceCategory {
  name: string;
  display_order: number;
  services: CatalogService[];
}
interface CatalogBranch {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  color_light: string;
  display_order: number;
  qualifications: Record<string, unknown>;
  service_categories: CatalogServiceCategory[];
}
interface Catalog {
  branches: CatalogBranch[];
}

const ICON_BY_BRANCH: Record<string, string> = {
  enb: "zap",
  arc: "ruler",
  sta: "pen-tool",
  bau: "hard-hat",
  sac: "search-check",
  vrm: "map",
  tga: "thermometer",
  bps: "shield",
};

const SLUG_BY_BRANCH: Record<string, string> = {
  enb: "energieberatung",
  arc: "architektur",
  sta: "statiker-tragwerksplaner",
  bau: "bauberatung-baubegleitung",
  sac: "gebaeudesachverstaendige",
  vrm: "vermesser-geodaeten",
  tga: "tga-fachplaner-haustechnik",
  bps: "bauphysik-spezialberatung",
};

const NAME_BY_BRANCH: Record<string, string> = {
  enb: "Energieberatung",
  arc: "Architektur",
  sta: "Statiker / Tragwerksplaner",
  bau: "Bauberatung / Baubegleitung",
  sac: "Gebäudesachverständige",
  vrm: "Vermesser / Geodäten",
  tga: "TGA-Fachplaner (Haustechnik)",
  bps: "Bauphysik & Spezialberatung",
};

/** Build a human-readable reference price string from v2 min/avg/max recommendations. */
function buildReferencePrice(svc: CatalogService): string {
  const fmt = (n: number) => `${n.toLocaleString("de-DE")} €`;
  const suffix = svc.price_type === "hr" ? "/h" : svc.price_type === "hoai" ? " (HOAI)" : "";
  const { p_min, p_avg, p_max } = svc;
  if (p_min != null && p_max != null && p_min !== p_max) {
    return `${fmt(p_min)}–${fmt(p_max)}${suffix}`;
  }
  if (p_avg != null) return `ø ${fmt(p_avg)}${suffix}`;
  if (p_min != null) return `ab ${fmt(p_min)}${suffix}`;
  return "auf Anfrage";
}

/**
 * Best-effort booking-slot length in minutes from a v2 duration string.
 * The full human-readable label is preserved separately in `durationLabel`;
 * this value is only the default appointment length a provider gets when
 * importing the template. Appointment-scale formats (minutes/hours/half-day/
 * days) are parsed precisely; project-scale lead-times (weeks/months/years,
 * "projektbegleitend", "individuell", "Bauzeit" …) cannot be a single slot and
 * are clamped to a standard 2h consultation.
 */
const PROJECT_SLOT_MINUTES = 120;
function num(x: string): number {
  return Number(x.replace(",", "."));
}
function avg(lo: string, hi: string | undefined): number {
  const a = num(lo);
  const b = hi != null ? num(hi) : a;
  return (a + b) / 2;
}
function parseDuration(d: string): number {
  if (!d) return 60;
  const s = d.toLowerCase();
  // Minutes: "ca. 30 Min."
  const minMatch = s.match(/(\d+)\s*min/);
  if (minMatch) return Number(minMatch[1]);
  // Hours (with decimals + ranges): "ca. 4–6h", "ca. 1,5h", "2–3h inkl. Anfahrt"
  const hMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:[–-]\s*(\d+(?:[.,]\d+)?))?\s*h\b/);
  if (hMatch) return Math.round(avg(hMatch[1]!, hMatch[2]) * 60);
  if (/halbtag/.test(s)) return 240;
  // Days (singular + plural + ranges): "1 Tag", "1–2 Tage", "ca. 1–3 Tage pro View"
  const dayMatch = s.match(/(\d+)\s*(?:[–-]\s*(\d+))?\s*tage?\b/);
  if (dayMatch) return Math.min(960, Math.round(avg(dayMatch[1]!, dayMatch[2]) * 480));
  // Weeks/months/years and open-ended project descriptors → standard consult slot.
  return PROJECT_SLOT_MINUTES;
}

async function main() {
  const catalogPath = resolve(__dirname, "../data/klard-katalog.json");
  const catalog: Catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

  // Fail-fast: validate mapping completeness BEFORE any destructive operation.
  const keepSlugs: string[] = [];
  for (const b of catalog.branches) {
    const slug = SLUG_BY_BRANCH[b.id];
    const name = NAME_BY_BRANCH[b.id];
    const icon = ICON_BY_BRANCH[b.id];
    if (!slug || !name || !icon) {
      throw new Error(`Missing slug/name/icon mapping for catalog branch '${b.id}'`);
    }
    keepSlugs.push(slug);
  }
  if (keepSlugs.length !== 8) {
    throw new Error(`Expected 8 branches, got ${keepSlugs.length}`);
  }

  await db.transaction(async (tx) => {
    console.log("Cleanup: removing providers (and their data) outside the new branch list…");
    const orphanProviders = await tx
      .select({ id: providersTable.id })
      .from(providersTable)
      .where(notInArray(providersTable.categorySlug, keepSlugs));
    const orphanIds = orphanProviders.map((p) => p.id);
    if (orphanIds.length > 0) {
      console.log(`  → ${orphanIds.length} orphan providers to remove`);
      await tx.delete(reviewsTable).where(inArray(reviewsTable.providerId, orphanIds));
      await tx.delete(bookingsTable).where(inArray(bookingsTable.providerId, orphanIds));
      await tx.delete(timeSlotsTable).where(inArray(timeSlotsTable.providerId, orphanIds));
      await tx.delete(servicesTable).where(inArray(servicesTable.providerId, orphanIds));
      await tx.delete(providersTable).where(inArray(providersTable.id, orphanIds));
    } else {
      console.log("  → no orphan providers");
    }

    const removedCats = await tx
      .delete(categoriesTable)
      .where(notInArray(categoriesTable.slug, keepSlugs))
      .returning({ slug: categoriesTable.slug });
    console.log(`  → removed ${removedCats.length} categories not in PDF`);

    console.log(`Seeding ${catalog.branches.length} categories with full metadata…`);
    for (const b of catalog.branches) {
      const slug = SLUG_BY_BRANCH[b.id]!;
      const name = NAME_BY_BRANCH[b.id]!;
      const icon = ICON_BY_BRANCH[b.id]!;
      await tx
        .insert(categoriesTable)
        .values({
          name,
          slug,
          icon,
          description: b.description,
          color: b.color,
          colorLight: b.color_light,
          displayOrder: b.display_order,
          qualifications: b.qualifications,
          requiresDirectBilling: false,
        })
        .onConflictDoUpdate({
          target: categoriesTable.slug,
          set: {
            name,
            icon,
            description: b.description,
            color: b.color,
            colorLight: b.color_light,
            displayOrder: b.display_order,
            qualifications: b.qualifications,
          },
        });
    }

    console.log("Wiping and reseeding service_templates…");
    await tx.delete(serviceTemplatesTable);
    let total = 0;
    let sortCounter = 0;
    for (const b of catalog.branches) {
      const slug = SLUG_BY_BRANCH[b.id]!;
      for (const sc of b.service_categories) {
        for (const svc of sc.services) {
          await tx.insert(serviceTemplatesTable).values({
            categorySlug: slug,
            groupName: sc.name,
            name: svc.name,
            priceType: svc.price_type,
            referencePrice: buildReferencePrice(svc),
            durationLabel: svc.duration,
            defaultDurationMinutes: parseDuration(svc.duration),
            defaultPrice: svc.p_avg ?? svc.p_min ?? null,
            priceMin: svc.p_min ?? null,
            priceAvg: svc.p_avg ?? null,
            priceMax: svc.p_max ?? null,
            unit: svc.unit ?? null,
            inputs: svc.inputs ?? [],
            fundable: svc.fundable ?? null,
            notes: svc.notes ?? null,
            sortOrder: sortCounter++,
          });
          total++;
        }
      }
    }
    console.log(`  → inserted ${total} service templates`);

    await tx.execute(sql`
      UPDATE categories c
      SET provider_count = (
        SELECT COUNT(*) FROM providers p WHERE p.category_slug = c.slug
      )
    `);
  });

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
