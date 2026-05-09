import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { providersTable, servicesTable } from "@workspace/db";
import { GenerateAiOfferBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_API_URL,
});

router.post("/ai/offer", async (req, res): Promise<void> => {
  try {
    const parsed = GenerateAiOfferBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { providerId, inquiry } = parsed.data;

    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, providerId))
      .limit(1);

    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const services = await db
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.providerId, providerId));

    const serviceList = services
      .map((s) => `- ${s.name}: ${s.price}€ (${s.durationMinutes} Min.)`)
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Du bist ein professioneller Berater namens "${provider.displayName}" in der Kategorie "${provider.category}" aus ${provider.city}.

Deine Dienstleistungen:
${serviceList || "Allgemeine Beratung"}

Ein potenzieller Kunde schreibt:
"${inquiry}"

Erstelle ein professionelles, personalisiertes Angebot auf Deutsch (max. 150 Wörter). Sei konkret und nenne einen ungefähren Preis.`,
        },
      ],
    });

    const offerText = message.content[0]?.type === "text" ? message.content[0].text : "";

    res.json({
      offer: offerText,
      estimatedPrice: services[0]?.price ?? null,
      estimatedDuration: services[0] ? `${services[0].durationMinutes} Minuten` : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI offer");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
