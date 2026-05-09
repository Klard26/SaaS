import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { providersTable } from "@workspace/db";
import {
  CreateProviderBody,
  UpdateProviderBody,
  UpdateProviderParams,
  GetProviderParams,
  ListProvidersQueryParams,
} from "@workspace/api-zod";
import { eq, ilike, or, and, gte, lte, type SQL } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/providers", async (req, res): Promise<void> => {
  try {
    const parsed = ListProvidersQueryParams.safeParse(req.query);
    const q = parsed.success ? parsed.data : {};

    const conditions: SQL[] = [];
    if (q.zip) conditions.push(eq(providersTable.zip, q.zip));
    if (q.city) conditions.push(ilike(providersTable.city, `%${q.city}%`));
    if (q.category) conditions.push(eq(providersTable.categorySlug, q.category));
    if (q.q) {
      conditions.push(
        or(
          ilike(providersTable.displayName, `%${q.q}%`),
          ilike(providersTable.bio, `%${q.q}%`),
        ) as SQL,
      );
    }

    const limit = q.limit ?? 20;
    const offset = q.offset ?? 0;

    const providers = await db
      .select()
      .from(providersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(providersTable.rating);

    res.json(providers);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch providers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/providers/me", async (req, res): Promise<void> => {
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

    if (!provider) {
      res.status(404).json({ error: "Provider profile not found" });
      return;
    }
    res.json(provider);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch own provider profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/providers/:id", async (req, res): Promise<void> => {
  try {
    const parsed = GetProviderParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, parsed.data.id))
      .limit(1);

    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }
    res.json(provider);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/providers", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const parsed = CreateProviderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const d = parsed.data;
    const [provider] = await db
      .insert(providersTable)
      .values({
        clerkUserId: userId,
        displayName: d.displayName,
        email: "",
        bio: d.bio,
        category: d.category,
        categorySlug: d.category.toLowerCase().replace(/\s+/g, "-"),
        city: d.city,
        zip: d.zip,
        address: d.address,
        phone: d.phone,
        website: d.website,
      })
      .returning();
    res.status(201).json(provider);
  } catch (err) {
    req.log.error({ err }, "Failed to create provider");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/providers/:id", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const paramsParsed = UpdateProviderParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const bodyParsed = UpdateProviderBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }
    const d = bodyParsed.data;
    const updateData: Record<string, unknown> = {};
    if (d.displayName !== undefined) updateData.displayName = d.displayName;
    if (d.bio !== undefined) updateData.bio = d.bio;
    if (d.category !== undefined) {
      updateData.category = d.category;
      updateData.categorySlug = d.category.toLowerCase().replace(/\s+/g, "-");
    }
    if (d.city !== undefined) updateData.city = d.city;
    if (d.zip !== undefined) updateData.zip = d.zip;
    if (d.address !== undefined) updateData.address = d.address;
    if (d.phone !== undefined) updateData.phone = d.phone;
    if (d.website !== undefined) updateData.website = d.website;
    if (d.avatarUrl !== undefined) updateData.avatarUrl = d.avatarUrl;

    const [updated] = await db
      .update(providersTable)
      .set(updateData)
      .where(eq(providersTable.id, paramsParsed.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update provider");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
