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
  reference_price: string;
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

/** Parse a reference_price like "ab 1.450 €" or "auf Anfrage" → numeric netto fallback. */
function parsePrice(ref: string): number | null {
  if (!ref) return null;
  const m = ref.match(/(\d[\d.]*)/);
  if (!m) return null;
  const num = Number(m[1].replace(/\./g, ""));
  return Number.isFinite(num) ? num : null;
}

/** Parse a duration string like "ca. 1 Tag" → minutes. Best-effort default 60. */
function parseDuration(d: string): number {
  if (!d) return 60;
  const s = d.toLowerCase();
  if (/halbtag/.test(s)) return 240;
  if (/\btag\b/.test(s)) {
    const m = s.match(/(\d+)\s*tag/);
    return m ? Number(m[1]) * 480 : 480;
  }
  // "ca. 3–4h", "ca. 2h", "ca. 6 h"
  const hMatch = s.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*h\b/);
  if (hMatch) {
    const lo = Number(hMatch[1]);
    const hi = hMatch[2] ? Number(hMatch[2]) : lo;
    return Math.round(((lo + hi) / 2) * 60);
  }
  const minMatch = s.match(/(\d+)\s*min/);
  if (minMatch) return Number(minMatch[1]);
  return 60;
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
            referencePrice: svc.reference_price,
            durationLabel: svc.duration,
            defaultDurationMinutes: parseDuration(svc.duration),
            defaultPrice: parsePrice(svc.reference_price),
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
