import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { providersTable, categoriesTable } from "@workspace/db";
import {
  CreateProviderBody,
  UpdateProviderBody,
  UpdateProviderParams,
  GetProviderParams,
  ListProvidersQueryParams,
} from "@workspace/api-zod";
import { eq, ilike, or, and, desc, type SQL, sql } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";
import { randomBytes } from "node:crypto";
import { slugify } from "../lib/slugify";
import { sendProviderWelcome } from "../lib/email";

const router: IRouter = Router();

async function getDirectBillingMap(): Promise<Record<string, boolean>> {
  const cats = await db.select({ slug: categoriesTable.slug, req: categoriesTable.requiresDirectBilling }).from(categoriesTable);
  const map: Record<string, boolean> = {};
  for (const c of cats) map[c.slug] = c.req ?? false;
  return map;
}

/**
 * Resolve a user-supplied category string to a real entry in `categories`.
 * Accepts either the canonical slug or the display name. Returns null if no
 * matching category exists, so the caller can respond with a 400 instead of
 * silently writing an orphan slug into the providers table.
 */
async function resolveCategory(input: string): Promise<{ name: string; slug: string } | null> {
  const candidate = slugify(input);
  const [bySlug] = await db
    .select({ name: categoriesTable.name, slug: categoriesTable.slug })
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, candidate))
    .limit(1);
  if (bySlug) return bySlug;

  const [byName] = await db
    .select({ name: categoriesTable.name, slug: categoriesTable.slug })
    .from(categoriesTable)
    .where(eq(categoriesTable.name, input))
    .limit(1);
  return byName ?? null;
}

function withDirectBilling<T extends { categorySlug?: string | null }>(p: T, map: Record<string, boolean>): T & { requiresDirectBilling: boolean } {
  return { ...p, requiresDirectBilling: !!(p.categorySlug && map[p.categorySlug]) };
}

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

    // Premium-first ranking: premium providers ahead of basic, then by rating desc, then by reviewCount desc.
    const providers = await db
      .select()
      .from(providersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(
        sql`CASE WHEN ${providersTable.subscriptionTier} = 'premium' THEN 0 ELSE 1 END`,
        desc(providersTable.rating),
        desc(providersTable.reviewCount),
      );

    const map = await getDirectBillingMap();
    res.json(providers.map(p => withDirectBilling(p, map)));
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
    const map = await getDirectBillingMap();
    res.json(withDirectBilling(provider, map));
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
    const map = await getDirectBillingMap();
    res.json(withDirectBilling(provider, map));
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
    const category = await resolveCategory(d.category);
    if (!category) {
      res.status(400).json({ error: `Unbekannte Branche: ${d.category}` });
      return;
    }
    let email = "";
    try {
      const u = await clerkClient.users.getUser(userId);
      email = u.primaryEmailAddress?.emailAddress ?? "";
    } catch {
      // ignore
    }
    const [provider] = await db
      .insert(providersTable)
      .values({
        clerkUserId: userId,
        displayName: d.displayName,
        email,
        bio: d.bio,
        category: category.name,
        categorySlug: category.slug,
        city: d.city,
        zip: d.zip,
        address: d.address,
        phone: d.phone,
        website: d.website,
        logoUrl: d.logoUrl,
        yearsExperience: d.yearsExperience,
        companyLegalName: d.companyLegalName,
        taxId: d.taxId,
        responseTime: d.responseTime,
        consultationMode: d.consultationMode ?? "both",
        certificates: d.certificates ?? [],
        qualifications: d.qualifications ?? null,
        icalToken: randomBytes(24).toString("hex"),
      })
      .returning();

    if (provider && email) {
      void sendProviderWelcome({ email, displayName: provider.displayName });
    }

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
    const [existing] = await db
      .select({ id: providersTable.id, clerkUserId: providersTable.clerkUserId })
      .from(providersTable)
      .where(eq(providersTable.id, paramsParsed.data.id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }
    if (existing.clerkUserId !== userId) {
      res.status(403).json({ error: "Forbidden" });
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
      const category = await resolveCategory(d.category);
      if (!category) {
        res.status(400).json({ error: `Unbekannte Branche: ${d.category}` });
        return;
      }
      updateData.category = category.name;
      updateData.categorySlug = category.slug;
    }
    if (d.city !== undefined) updateData.city = d.city;
    if (d.zip !== undefined) updateData.zip = d.zip;
    if (d.address !== undefined) updateData.address = d.address;
    if (d.phone !== undefined) updateData.phone = d.phone;
    if (d.website !== undefined) updateData.website = d.website;
    if (d.avatarUrl !== undefined) updateData.avatarUrl = d.avatarUrl;
    if (d.logoUrl !== undefined) updateData.logoUrl = d.logoUrl;
    if (d.yearsExperience !== undefined) updateData.yearsExperience = d.yearsExperience;
    if (d.companyLegalName !== undefined) updateData.companyLegalName = d.companyLegalName;
    if (d.taxId !== undefined) updateData.taxId = d.taxId;
    if (d.responseTime !== undefined) updateData.responseTime = d.responseTime;
    if (d.consultationMode !== undefined) updateData.consultationMode = d.consultationMode;
    if (d.certificates !== undefined) updateData.certificates = d.certificates;
    if (d.qualifications !== undefined) updateData.qualifications = d.qualifications;

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
