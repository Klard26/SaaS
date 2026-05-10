import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providersTable = pgTable("providers", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  bio: text("bio"),
  category: text("category").notNull(),
  categorySlug: text("category_slug").notNull(),
  city: text("city").notNull(),
  zip: text("zip").notNull(),
  address: text("address"),
  website: text("website"),
  avatarUrl: text("avatar_url"),
  logoUrl: text("logo_url"),
  yearsExperience: integer("years_experience"),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  subscriptionTier: text("subscription_tier").notNull().default("basic"),
  premiumSince: timestamp("premium_since"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  icalToken: text("ical_token"),
  calendarSyncUrl: text("calendar_sync_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({ id: true, createdAt: true });
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
