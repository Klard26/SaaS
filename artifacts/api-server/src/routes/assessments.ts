import { Router, type IRouter } from "express";
import { db, assessmentsTable, providersTable } from "@workspace/db";
import {
  CreateAssessmentBody,
  GetAssessmentParams,
  DeleteAssessmentParams,
} from "@workspace/api-zod";
import { eq, desc, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { sendProviderAssessmentSaved } from "../lib/email";

const router: IRouter = Router();

router.get("/assessments", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const rows = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.userId, userId))
      .orderBy(desc(assessmentsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list assessments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/assessments", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const parsed = CreateAssessmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const d = parsed.data;

    // If providerId is set, the caller must own that provider profile.
    if (d.providerId != null) {
      const [p] = await db
        .select()
        .from(providersTable)
        .where(eq(providersTable.id, d.providerId))
        .limit(1);
      if (!p || p.clerkUserId !== userId) {
        res.status(403).json({ error: "Kein Zugriff auf dieses Berater-Profil." });
        return;
      }
      if (p.subscriptionTier !== "premium") {
        res.status(403).json({
          error: "Die Mandanten-Gebäudeanalyse ist eine Premium-Funktion.",
        });
        return;
      }
    }

    const [row] = await db
      .insert(assessmentsTable)
      .values({
        userId,
        label: d.label,
        providerId: d.providerId ?? null,
        addressJson: d.addressJson ?? null,
        inputJson: d.inputJson,
        resultJson: d.resultJson,
      })
      .returning();

    if (row && d.providerId != null) {
      const [p] = await db
        .select()
        .from(providersTable)
        .where(eq(providersTable.id, d.providerId))
        .limit(1);
      if (p?.email) {
        const r = (d.resultJson ?? {}) as Record<string, unknown>;
        const energie = r["energie"] as { klasse?: { c?: string } } | undefined;
        const value = r["value"] as { total?: number } | undefined;
        const addr = (d.addressJson ?? {}) as Record<string, unknown>;
        void sendProviderAssessmentSaved({
          providerEmail: p.email,
          providerName: p.displayName,
          label: d.label,
          energyClass: energie?.klasse?.c ?? null,
          marketValue: value?.total ?? null,
          city: (addr["city"] as string | null) ?? null,
        });
      }
    }

    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to create assessment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/assessments/:id", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const parsed = GetAssessmentParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [row] = await db
      .select()
      .from(assessmentsTable)
      .where(
        and(
          eq(assessmentsTable.id, parsed.data.id),
          eq(assessmentsTable.userId, userId),
        ),
      )
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch assessment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/assessments/:id", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const parsed = DeleteAssessmentParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const result = await db
      .delete(assessmentsTable)
      .where(
        and(
          eq(assessmentsTable.id, parsed.data.id),
          eq(assessmentsTable.userId, userId),
        ),
      )
      .returning({ id: assessmentsTable.id });
    if (result.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete assessment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
