import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Förderschiene — funding-program catalogue (flattened from the Förderpilot
 * classification schema). Amtliche Stammdaten + a few redaktionelle fields.
 * `tags` drives the building-profile matching engine (e.g. "heizung",
 * "daemmung", "fenster", "pv", "komplett", "steuer", "beratung").
 */
export const foerderProgrammeTable = pgTable("foerder_programme", {
  id: text("id").primaryKey(),
  titel: text("titel").notNull(),
  foerdergeber: text("foerdergeber").notNull(),
  ebene: text("ebene").notNull(), // bund | land | eu | kommune
  art: text("art").notNull(), // zuschuss | kredit | steuer | beratung
  timing: text("timing").notNull().default("vor_vorhabenbeginn"),
  foerderquoteText: text("foerderquote_text").notNull(),
  quoteMax: integer("quote_max"),
  maxBetragText: text("max_betrag_text").notNull(),
  maxBetragEur: integer("max_betrag_eur"),
  kurzbeschreibung: text("kurzbeschreibung").notNull(),
  besonderheit: text("besonderheit"),
  quelleUrl: text("quelle_url"),
  erfolgsquote: integer("erfolgsquote"),
  tags: text("tags").array().notNull().default([]),
  region: text("region").notNull().default("bundesweit"),
  aktiv: boolean("aktiv").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FoerderProgramm = typeof foerderProgrammeTable.$inferSelect;

/**
 * One row per detailed Gebäudereport. The free preview never creates a row; a
 * paid report is created at checkout (status "pending") and unlocked
 * ("paid") via the Stripe webhook or success-redirect reconcile. The building
 * profile is stored as JSON so the saved report can be re-rendered later.
 */
export const foerderschieneReportsTable = pgTable("foerderschiene_reports", {
  id: serial("id").primaryKey(),
  // Nullable: a report can be bought as a guest (Express Checkout, no account).
  userId: text("user_id"),
  sessionId: text("session_id"),
  // Buyer email captured from the Stripe Checkout session (for the PDF link mail).
  email: text("email"),
  status: text("status").notNull().default("pending"), // pending | paid
  amountCents: integer("amount_cents").notNull(),
  adresse: text("adresse"),
  profil: jsonb("profil").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export type FoerderschieneReport = typeof foerderschieneReportsTable.$inferSelect;

/**
 * Guided PAID order for a legally-valid Energieausweis. Klard/Förderschiene
 * never generates the document — it collects the intake (energieausweis.de
 * fields), takes payment, and queues the order for a certified Aussteller.
 * Status flow: pending_payment → bezahlt → in_bearbeitung → ausgestellt
 * (or storniert).
 */
export const energieausweisOrdersTable = pgTable("energieausweis_orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id"),
  ausweisTyp: text("ausweis_typ").notNull(), // bedarf | verbrauch
  status: text("status").notNull().default("pending_payment"),
  amountCents: integer("amount_cents").notNull(),
  kontaktName: text("kontakt_name").notNull(),
  kontaktEmail: text("kontakt_email").notNull(),
  intake: jsonb("intake").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const insertEnergieausweisOrderSchema = createInsertSchema(
  energieausweisOrdersTable,
).omit({ id: true, createdAt: true, paidAt: true });
export type InsertEnergieausweisOrder = z.infer<
  typeof insertEnergieausweisOrderSchema
>;
export type EnergieausweisOrder = typeof energieausweisOrdersTable.$inferSelect;
