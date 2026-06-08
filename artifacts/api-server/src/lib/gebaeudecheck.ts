import { db } from "@workspace/db";
import { gebaeudecheckCreditsTable, gebaeudecheckOrdersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

/**
 * Credit packages for the paid Gebäudecheck Vollanalyse. One credit unlocks
 * one full report. Prices in euro cents.
 */
export interface GebaeudecheckPackage {
  id: string;
  credits: number;
  amountCents: number;
  label: string;
}

export const GEBAEUDECHECK_PACKAGES: GebaeudecheckPackage[] = [
  { id: "single", credits: 1, amountCents: 1999, label: "Einzelreport" },
  { id: "pack5", credits: 5, amountCents: 7999, label: "5er-Paket" },
  { id: "pack10", credits: 10, amountCents: 9999, label: "10er-Paket" },
  { id: "pack25", credits: 25, amountCents: 19999, label: "25er-Paket" },
  { id: "pack50", credits: 50, amountCents: 34999, label: "50er-Paket" },
];

export function getPackage(id: string): GebaeudecheckPackage | undefined {
  return GEBAEUDECHECK_PACKAGES.find((p) => p.id === id);
}

/** Current credit balance for a user (0 if no row yet). */
export async function getCreditBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ balance: gebaeudecheckCreditsTable.balance })
    .from(gebaeudecheckCreditsTable)
    .where(eq(gebaeudecheckCreditsTable.userId, userId))
    .limit(1);
  return row?.balance ?? 0;
}

/** Add credits to a user, creating the row if needed. */
export async function addCredits(userId: string, amount: number): Promise<void> {
  await db
    .insert(gebaeudecheckCreditsTable)
    .values({ userId, balance: amount })
    .onConflictDoUpdate({
      target: gebaeudecheckCreditsTable.userId,
      set: {
        balance: sql`${gebaeudecheckCreditsTable.balance} + ${amount}`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Atomically consume one credit. Returns true if a credit was spent, false if
 * the user has no balance left.
 */
export async function consumeCredit(userId: string): Promise<boolean> {
  const rows = await db
    .update(gebaeudecheckCreditsTable)
    .set({
      balance: sql`${gebaeudecheckCreditsTable.balance} - 1`,
      updatedAt: new Date(),
    })
    .where(
      sql`${gebaeudecheckCreditsTable.userId} = ${userId} AND ${gebaeudecheckCreditsTable.balance} > 0`,
    )
    .returning({ balance: gebaeudecheckCreditsTable.balance });
  return rows.length > 0;
}

/**
 * Idempotently fulfill a paid order: flips a `pending` order to `paid` and
 * grants its credits exactly once. Safe to call from both the Stripe webhook
 * and the success-redirect reconcile. Returns true when credits were granted.
 */
export async function fulfillOrder(sessionId: string): Promise<boolean> {
  const claimed = await db
    .update(gebaeudecheckOrdersTable)
    .set({ status: "paid", updatedAt: new Date() })
    .where(
      sql`${gebaeudecheckOrdersTable.sessionId} = ${sessionId} AND ${gebaeudecheckOrdersTable.status} = 'pending'`,
    )
    .returning({
      userId: gebaeudecheckOrdersTable.userId,
      credits: gebaeudecheckOrdersTable.credits,
    });
  const order = claimed[0];
  if (!order) return false;
  await addCredits(order.userId, order.credits);
  return true;
}
