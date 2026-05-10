import { db, categoriesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const CATEGORIES: Array<{ name: string; slug: string; icon: string; requiresDirectBilling?: boolean }> = [
  { name: "Steuerberater", slug: "steuerberater", icon: "calculator", requiresDirectBilling: true },
  { name: "Rechtsanwalt", slug: "rechtsanwalt", icon: "scale", requiresDirectBilling: true },
  { name: "Notar", slug: "notar", icon: "file-signature", requiresDirectBilling: true },
  { name: "Wirtschaftsprüfer", slug: "wirtschaftspruefer", icon: "clipboard-check", requiresDirectBilling: true },
  { name: "Unternehmensberater", slug: "unternehmensberater", icon: "briefcase" },
  { name: "Strategieberater", slug: "strategieberater", icon: "compass" },
  { name: "Finanzberater", slug: "finanzberater", icon: "trending-up" },
  { name: "Versicherungsmakler", slug: "versicherungsmakler", icon: "shield" },
  { name: "Immobilienmakler", slug: "immobilienmakler", icon: "home" },
  { name: "Existenzgründungsberater", slug: "existenzgruendungsberater", icon: "rocket" },
  { name: "Fördermittelberater", slug: "foerdermittelberater", icon: "coins" },
  { name: "Marketingberater", slug: "marketingberater", icon: "megaphone" },
  { name: "SEO- & Online-Marketing", slug: "seo-online-marketing", icon: "search" },
  { name: "PR-Berater", slug: "pr-berater", icon: "newspaper" },
  { name: "Vertriebsberater", slug: "vertriebsberater", icon: "target" },
  { name: "IT- & Digitalberatung", slug: "it-digitalberatung", icon: "laptop" },
  { name: "Datenschutzbeauftragter (DSGVO)", slug: "datenschutzbeauftragter", icon: "lock" },
  { name: "Cybersecurity-Berater", slug: "cybersecurity-berater", icon: "shield-check" },
  { name: "Personalberater", slug: "personalberater", icon: "users" },
  { name: "Karriere- & Bewerbungscoach", slug: "karriere-coach", icon: "user-check" },
  { name: "Business- & Life-Coach", slug: "business-life-coach", icon: "sparkles" },
  { name: "Mediator", slug: "mediator", icon: "handshake" },
  { name: "Psychologische Beratung", slug: "psychologische-beratung", icon: "brain" },
  { name: "Ernährungsberater", slug: "ernaehrungsberater", icon: "apple" },
  { name: "Gesundheitscoach", slug: "gesundheitscoach", icon: "heart-pulse" },
  { name: "Energieberater", slug: "energieberater", icon: "zap" },
  { name: "Nachhaltigkeits- & ESG-Berater", slug: "nachhaltigkeits-esg-berater", icon: "leaf" },
  { name: "Architekt & Bauberater", slug: "architekt-bauberater", icon: "ruler" },
  { name: "Sachverständiger / Gutachter", slug: "sachverstaendiger", icon: "search-check" },
  { name: "Erbrechts- & Vorsorgeberatung", slug: "erbrecht-vorsorge", icon: "scroll" },
  { name: "Logistik- & Supply-Chain-Berater", slug: "logistik-berater", icon: "truck" },
  { name: "M&A- & Transaktionsberater", slug: "ma-transaktionsberater", icon: "git-merge" },
  { name: "Innovations- & R&D-Berater", slug: "innovations-berater", icon: "lightbulb" },
  { name: "Steuer-Coach für Privatpersonen", slug: "steuer-coach-privat", icon: "receipt" },
];

async function main() {
  console.log(`Seeding ${CATEGORIES.length} categories...`);
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
