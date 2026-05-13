import {
  db,
  categoriesTable,
  providersTable,
  servicesTable,
  bookingsTable,
  reviewsTable,
  timeSlotsTable,
} from "@workspace/db";
import { sql, inArray, notInArray } from "drizzle-orm";

const CATEGORIES: Array<{
  name: string;
  slug: string;
  icon: string;
  requiresDirectBilling?: boolean;
}> = [
  { name: "Energieberatung", slug: "energieberatung", icon: "zap" },
  { name: "Architektur", slug: "architektur", icon: "ruler" },
  { name: "Statiker / Tragwerksplaner", slug: "statiker-tragwerksplaner", icon: "pen-tool" },
  { name: "Bauberatung / Baubegleitung", slug: "bauberatung-baubegleitung", icon: "hard-hat" },
  { name: "Gebäudesachverständige", slug: "gebaeudesachverstaendige", icon: "search-check" },
  { name: "Vermesser / Geodäten", slug: "vermesser-geodaeten", icon: "map" },
  { name: "TGA-Fachplaner (Haustechnik)", slug: "tga-fachplaner-haustechnik", icon: "thermometer" },
  { name: "Bauphysik & Spezialberatung", slug: "bauphysik-spezialberatung", icon: "shield" },
];

async function main() {
  const keepSlugs = CATEGORIES.map((c) => c.slug);

  console.log("Cleanup: removing providers (and their data) outside the new branch list…");

  const orphanProviders = await db
    .select({ id: providersTable.id })
    .from(providersTable)
    .where(notInArray(providersTable.categorySlug, keepSlugs));
  const orphanIds = orphanProviders.map((p) => p.id);

  if (orphanIds.length > 0) {
    console.log(`  → ${orphanIds.length} orphan providers to remove`);
    await db.delete(reviewsTable).where(inArray(reviewsTable.providerId, orphanIds));
    await db.delete(bookingsTable).where(inArray(bookingsTable.providerId, orphanIds));
    await db.delete(timeSlotsTable).where(inArray(timeSlotsTable.providerId, orphanIds));
    await db.delete(servicesTable).where(inArray(servicesTable.providerId, orphanIds));
    await db.delete(providersTable).where(inArray(providersTable.id, orphanIds));
  } else {
    console.log("  → no orphan providers");
  }

  const removed = await db
    .delete(categoriesTable)
    .where(notInArray(categoriesTable.slug, keepSlugs))
    .returning({ slug: categoriesTable.slug });
  console.log(`  → removed ${removed.length} categories not in PDF`);

  console.log(`Seeding ${CATEGORIES.length} categories…`);
  for (const cat of CATEGORIES) {
    await db
      .insert(categoriesTable)
      .values({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        requiresDirectBilling: cat.requiresDirectBilling ?? false,
      })
      .onConflictDoUpdate({
        target: categoriesTable.slug,
        set: {
          name: cat.name,
          icon: cat.icon,
          requiresDirectBilling: cat.requiresDirectBilling ?? false,
        },
      });
  }

  await db.execute(sql`
    UPDATE categories c
    SET provider_count = (
      SELECT COUNT(*) FROM providers p WHERE p.category_slug = c.slug
    )
  `);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
