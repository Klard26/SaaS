import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emailLogTable = pgTable(
  "email_log",
  {
    id: serial("id").primaryKey(),
    templateId: text("template_id").notNull(),
    recipient: text("recipient").notNull(),
    relatedId: text("related_id"),
    subject: text("subject"),
    status: text("status").notNull(),
    error: text("error"),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
  },
  (t) => ({
    templateRelatedIdx: index("email_log_template_related_idx").on(
      t.templateId,
      t.relatedId,
    ),
    sentAtIdx: index("email_log_sent_at_idx").on(t.sentAt),
  }),
);

export const insertEmailLogSchema = createInsertSchema(emailLogTable).omit({
  id: true,
  sentAt: true,
});
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogTable.$inferSelect;
