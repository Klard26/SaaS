import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";

export const serviceTemplatesTable = pgTable("service_templates", {
  id: serial("id").primaryKey(),
  categorySlug: text("category_slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  defaultDurationMinutes: integer("default_duration_minutes").notNull().default(60),
  defaultPrice: real("default_price"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type ServiceTemplate = typeof serviceTemplatesTable.$inferSelect;
