import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db";
import {
  CreateServiceBody,
  CreateServiceParams,
  UpdateServiceBody,
  UpdateServiceParams,
  DeleteServiceParams,
  ListProviderServicesParams,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/providers/:id/services", async (req, res): Promise<void> => {
  try {
    const parsed = ListProviderServicesParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const services = await db
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.providerId, parsed.data.id))
      .orderBy(servicesTable.price);
    res.json(services);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch services");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/providers/:id/services", async (req, res): Promise<void> => {
  try {
    const paramsParsed = CreateServiceParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const bodyParsed = CreateServiceBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }
    const d = bodyParsed.data;
    const [service] = await db
      .insert(servicesTable)
      .values({
        providerId: paramsParsed.data.id,
        name: d.name,
        description: d.description,
        price: d.price,
        durationMinutes: d.durationMinutes,
      })
      .returning();
    res.status(201).json(service);
  } catch (err) {
    req.log.error({ err }, "Failed to create service");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/services/:id", async (req, res): Promise<void> => {
  try {
    const paramsParsed = UpdateServiceParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const bodyParsed = UpdateServiceBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: bodyParsed.error.message });
      return;
    }
    const d = bodyParsed.data;
    const updateData: Record<string, unknown> = {};
    if (d.name !== undefined) updateData.name = d.name;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.price !== undefined) updateData.price = d.price;
    if (d.durationMinutes !== undefined) updateData.durationMinutes = d.durationMinutes;

    const [updated] = await db
      .update(servicesTable)
      .set(updateData)
      .where(eq(servicesTable.id, paramsParsed.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update service");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  try {
    const parsed = DeleteServiceParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(servicesTable).where(eq(servicesTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete service");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
