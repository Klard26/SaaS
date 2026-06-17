import { Router, type IRouter } from "express";
import {
  db,
  providersTable,
  servicesTable,
  timeSlotsTable,
  bookingsTable,
  reviewsTable,
  immobilienKundeTable,
  verwalterTable,
  assessmentsTable,
  offerAcceptancesTable,
  gebaeudecheckCreditsTable,
  gebaeudecheckOrdersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { getRole, claimRole, RoleConflictError, type UserRole } from "../lib/userRole";

const router: IRouter = Router();

/** Read the current user's role (customer | provider), or null if none claimed. */
router.get("/account/role", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const role = await getRole(userId);
  res.status(200).json({ role });
});

/**
 * Claim a role for the current user. Enforces strict separation: if the account
 * already holds the OTHER role, this returns 409 instead of switching. Idempotent
 * when the same role is re-claimed.
 */
router.post("/account/role", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const wanted = (req.body as { role?: string })?.role;
  if (wanted !== "customer" && wanted !== "provider") {
    res.status(400).json({ error: "role must be 'customer' or 'provider'" });
    return;
  }
  try {
    const role = await claimRole(userId, wanted as UserRole);
    res.status(200).json({ role });
  } catch (err) {
    if (err instanceof RoleConflictError) {
      res.status(409).json({
        error:
          err.current === "provider"
            ? "Dieses Konto ist ein Berater-Konto und kann nicht als Kunde verwendet werden."
            : "Dieses Konto ist ein Kunden-Konto und kann nicht als Berater verwendet werden.",
        current: err.current,
      });
      return;
    }
    req.log.error({ err }, "Failed to claim role");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Permanently delete the authenticated user's entire Klard account — provider
 * profile (Berater), customer profile (Kunde), all bookings, reviews and the
 * Energiewechsel (WattWechsel) portfolio — and the Clerk auth user.
 *
 * This is the standard self-service "Konto löschen" flow: it removes every
 * trace of the user across roles, then deletes the login itself so they are
 * fully signed out and cannot log back in. The action is irreversible.
 */
router.delete("/account/me", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.clerkUserId, userId))
      .limit(1);

    // Best-effort: stop any active Stripe subscription immediately so the user
    // is not billed after deletion. Never block account deletion on Stripe.
    if (provider?.stripeSubscriptionId) {
      try {
        const stripe = await getUncachableStripeClient();
        if (stripe) {
          await stripe.subscriptions.cancel(provider.stripeSubscriptionId);
        }
      } catch (err) {
        req.log.warn({ err, providerId: provider.id }, "Stripe subscription cancel on account deletion failed");
      }
    }

    // Remove all DB data in a single transaction. Provider-owned tables
    // (services, time_slots, bookings, reviews) have no FK cascade, so they are
    // deleted explicitly; blocked_slots and invoices cascade off the provider
    // row, and the verwalter cascade clears the whole Energiewechsel portfolio.
    await db.transaction(async (tx) => {
      if (provider) {
        await tx.delete(servicesTable).where(eq(servicesTable.providerId, provider.id));
        await tx.delete(timeSlotsTable).where(eq(timeSlotsTable.providerId, provider.id));
        await tx.delete(reviewsTable).where(eq(reviewsTable.providerId, provider.id));
        await tx.delete(bookingsTable).where(eq(bookingsTable.providerId, provider.id));
        await tx.delete(providersTable).where(eq(providersTable.id, provider.id));
      }
      // All user-keyed data (keyed by the Clerk user id across both roles).
      await tx.delete(reviewsTable).where(eq(reviewsTable.customerId, userId));
      await tx.delete(bookingsTable).where(eq(bookingsTable.customerId, userId));
      await tx.delete(immobilienKundeTable).where(eq(immobilienKundeTable.userId, userId));
      await tx.delete(offerAcceptancesTable).where(eq(offerAcceptancesTable.userId, userId));
      await tx.delete(assessmentsTable).where(eq(assessmentsTable.userId, userId));
      await tx.delete(gebaeudecheckOrdersTable).where(eq(gebaeudecheckOrdersTable.userId, userId));
      await tx.delete(gebaeudecheckCreditsTable).where(eq(gebaeudecheckCreditsTable.userId, userId));
      // Energiewechsel (WattWechsel) portfolio cascades off verwalter.
      await tx.delete(verwalterTable).where(eq(verwalterTable.clerkUserId, userId));
    });

    // Finally, delete the Clerk login itself. The DB deletes above are
    // idempotent (deleting already-removed rows is a no-op), so if this call
    // fails the client can safely retry: the second attempt finds the data
    // already gone and just re-tries the Clerk deletion. A "user not found"
    // result means a prior attempt already deleted the login — treat as success.
    try {
      await clerkClient.users.deleteUser(userId);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status !== 404) {
        req.log.error({ err }, "Clerk user deletion failed after data removal; client should retry");
        res.status(500).json({ error: "Konto-Daten entfernt, aber der Zugang konnte nicht gelöscht werden. Bitte erneut versuchen." });
        return;
      }
    }

    res.status(200).json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete account");
    res.status(500).json({ error: "Konto konnte nicht gelöscht werden." });
  }
});

export default router;
