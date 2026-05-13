import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull().default("briefcase"),
  description: text("description"),
  color: text("color"),
  colorLight: text("color_light"),
  displayOrder: integer("display_order").notNull().default(0),
  providerCount: integer("provider_count").notNull().default(0),
  requiresDirectBilling: boolean("requires_direct_billing").notNull().default(false),
  qualifications: jsonb("qualifications"),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;
