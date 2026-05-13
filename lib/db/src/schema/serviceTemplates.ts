import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";

export const serviceTemplatesTable = pgTable("service_templates", {
  id: serial("id").primaryKey(),
  categorySlug: text("category_slug").notNull(),
  groupName: text("group_name"),
  name: text("name").notNull(),
  description: text("description"),
  priceType: text("price_type"),
  referencePrice: text("reference_price"),
  durationLabel: text("duration_label"),
  defaultDurationMinutes: integer("default_duration_minutes").notNull().default(60),
  defaultPrice: real("default_price"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type ServiceTemplate = typeof serviceTemplatesTable.$inferSelect;
