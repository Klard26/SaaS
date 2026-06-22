import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  foerderschieneReportsTable,
  energieausweisOrdersTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { getUncachableStripeClient, STRIPE_CONFIG } from "../lib/stripeClient";
import {
  listProgramme,
  matchFoerderschiene,
  fulfillReport,
  fulfillEnergieausweis,
  deliverReportReadyEmail,
  energieausweisPrice,
  REPORT_PRICE_CENTS,
  type MatchInput,
} from "../lib/foerderschiene";

const router: IRouter = Router();

function getBaseUrl(req: import("express").Request): string {
  const host = req.get("host");
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return `${proto}://${host}`;
}

router.get("/foerderschiene/programme", async (req, res): Promise<void> => {
  try {
    const programme = await listProgramme();
    res.json(programme);
  } catch (err) {
    req.log.error({ err }, "Failed to list foerder programme");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/foerderschiene/match", async (req, res): Promise<void> => {
  try {
    const body = (req.body ?? {}) as Partial<MatchInput>;
    const baujahr = Number(body.baujahr);
    const wohnflaeche = Number(body.wohnflaeche);
    if (!Number.isFinite(baujahr) || !Number.isFinite(wohnflaeche)) {
      res.status(400).json({ error: "baujahr und wohnflaeche sind erforderlich" });
      return;
    }
    const result = await matchFoerderschiene({
      baujahr,
      wohnflaeche,
      wohneinheiten:
        body.wohneinheiten != null ? Number(body.wohneinheiten) : null,
      heizung: String(body.heizung ?? ""),
      massnahmen: Array.isArray(body.massnahmen)
        ? body.massnahmen.map(String)
        : [],
      selbstgenutzt:
        typeof body.selbstgenutzt === "boolean" ? body.selbstgenutzt : null,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to match foerderschiene");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/foerderschiene/report/checkout", async (req, res): Promise<void> => {
  try {
    // Guest Express-Checkout: a report can be bought without an account.
    // If the buyer happens to be signed in we still attach their userId.
    const { userId } = getAuth(req);
    const body = (req.body ?? {}) as {
      adresse?: unknown;
      profil?: unknown;
      kontakt?: unknown;
    };
    if (!body.profil || typeof body.profil !== "object") {
      res.status(400).json({ error: "profil ist erforderlich" });
      return;
    }
    // Optional buyer Personalien (for registration / report assignment). All
    // fields optional; only used to prefill Stripe + store as metadata.
    const k =
      body.kontakt && typeof body.kontakt === "object"
        ? (body.kontakt as Record<string, unknown>)
        : {};
    const str = (v: unknown) => {
      const s = v != null ? String(v).trim() : "";
      return s.length > 0 ? s : undefined;
    };
    const kontakt = {
      vorname: str(k.vorname),
      nachname: str(k.nachname),
      email: str(k.email),
      telefon: str(k.telefon),
      anschrift: str(k.anschrift),
    };
    const kontaktName = [kontakt.vorname, kontakt.nachname]
      .filter(Boolean)
      .join(" ");
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).json({
        error:
          "Stripe ist noch nicht verbunden. Bitte aktivieren Sie die Stripe-Integration im Replit-Workspace.",
      });
      return;
    }
    const adresse = body.adresse != null ? String(body.adresse) : null;
    const [report] = await db
      .insert(foerderschieneReportsTable)
      .values({
        userId: userId ?? null,
        status: "pending",
        amountCents: REPORT_PRICE_CENTS,
        adresse,
        profil: body.profil,
      })
      .returning();

    const baseUrl = getBaseUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            unit_amount: REPORT_PRICE_CENTS,
            product_data: {
              name: "Detaillierter Gebäudereport (PDF) – Förderschiene",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/foerderschiene/report?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/foerderschiene/report?status=cancelled`,
      ...(kontakt.email ? { customer_email: kontakt.email } : {}),
      metadata: {
        kind: "foerderschiene_report",
        reportId: String(report.id),
        ...(userId ? { userId } : {}),
        ...(kontaktName ? { kontaktName } : {}),
        ...(kontakt.telefon ? { kontaktTelefon: kontakt.telefon } : {}),
        ...(kontakt.anschrift ? { kontaktAnschrift: kontakt.anschrift } : {}),
      },
    });

    await db
      .update(foerderschieneReportsTable)
      .set({ sessionId: session.id })
      .where(eq(foerderschieneReportsTable.id, report.id));

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    req.log.error({ err }, "Failed to create report checkout");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/foerderschiene/report/reconcile", async (req, res): Promise<void> => {
  try {
    // Guest flow: possession of the Checkout sessionId is the only credential
    // needed to unlock + view the report (no account, no ownership check).
    const sessionId = String((req.body as { sessionId?: unknown })?.sessionId ?? "");
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }
    const [report] = await db
      .select()
      .from(foerderschieneReportsTable)
      .where(eq(foerderschieneReportsTable.sessionId, sessionId))
      .limit(1);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "Stripe nicht konfiguriert" });
      return;
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      await fulfillReport(sessionId);
      await deliverReportReadyEmail(session, getBaseUrl(req));
    }
    const [fresh] = await db
      .select()
      .from(foerderschieneReportsTable)
      .where(eq(foerderschieneReportsTable.id, report.id))
      .limit(1);
    res.json(fresh ?? report);
  } catch (err) {
    req.log.error({ err }, "Failed to reconcile report");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/foerderschiene/reports", async (req, res): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const reports = await db
      .select()
      .from(foerderschieneReportsTable)
      .where(eq(foerderschieneReportsTable.userId, userId))
      .orderBy(desc(foerderschieneReportsTable.createdAt));
    res.json(reports);
  } catch (err) {
    req.log.error({ err }, "Failed to list reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/foerderschiene/energieausweis/checkout",
  async (req, res): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const body = (req.body ?? {}) as {
        ausweisTyp?: unknown;
        kontaktName?: unknown;
        kontaktEmail?: unknown;
        intake?: unknown;
      };
      const ausweisTyp = String(body.ausweisTyp ?? "");
      const price = energieausweisPrice(ausweisTyp);
      if (!price) {
        res.status(400).json({ error: "Unbekannter Ausweistyp" });
        return;
      }
      const kontaktName = String(body.kontaktName ?? "").trim();
      const kontaktEmail = String(body.kontaktEmail ?? "").trim();
      if (!kontaktName || !kontaktEmail) {
        res
          .status(400)
          .json({ error: "Name und E-Mail des Kontakts sind erforderlich" });
        return;
      }
      if (!body.intake || typeof body.intake !== "object") {
        res.status(400).json({ error: "intake ist erforderlich" });
        return;
      }
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        res.status(503).json({
          error:
            "Stripe ist noch nicht verbunden. Bitte aktivieren Sie die Stripe-Integration im Replit-Workspace.",
        });
        return;
      }
      const [order] = await db
        .insert(energieausweisOrdersTable)
        .values({
          userId,
          ausweisTyp,
          status: "pending_payment",
          amountCents: price,
          kontaktName,
          kontaktEmail,
          intake: body.intake,
        })
        .returning();

      const baseUrl = getBaseUrl(req);
      const label =
        ausweisTyp === "bedarf"
          ? "Energiebedarfsausweis"
          : "Energieverbrauchsausweis";
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: STRIPE_CONFIG.currency,
              unit_amount: price,
              product_data: {
                name: `${label} – Ausstellung durch zertifizierten Aussteller`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/foerderschiene/energieausweis?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/foerderschiene/energieausweis?status=cancelled`,
        customer_email: kontaktEmail || undefined,
        metadata: {
          kind: "foerderschiene_energieausweis",
          userId,
          orderId: String(order.id),
        },
      });

      await db
        .update(energieausweisOrdersTable)
        .set({ sessionId: session.id })
        .where(eq(energieausweisOrdersTable.id, order.id));

      res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      req.log.error({ err }, "Failed to create energieausweis checkout");
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
);

router.post(
  "/foerderschiene/energieausweis/reconcile",
  async (req, res): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const sessionId = String(
        (req.body as { sessionId?: unknown })?.sessionId ?? "",
      );
      if (!sessionId) {
        res.status(400).json({ error: "Missing sessionId" });
        return;
      }
      const [order] = await db
        .select()
        .from(energieausweisOrdersTable)
        .where(eq(energieausweisOrdersTable.sessionId, sessionId))
        .limit(1);
      if (!order || order.userId !== userId) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      const stripe = await getUncachableStripeClient();
      if (!stripe) {
        res.status(503).json({ error: "Stripe nicht konfiguriert" });
        return;
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await fulfillEnergieausweis(sessionId);
      }
      const [fresh] = await db
        .select()
        .from(energieausweisOrdersTable)
        .where(eq(energieausweisOrdersTable.id, order.id))
        .limit(1);
      res.json(fresh ?? order);
    } catch (err) {
      req.log.error({ err }, "Failed to reconcile energieausweis order");
      res.status(500).json({ error: "Failed" });
    }
  },
);

router.get(
  "/foerderschiene/energieausweis/orders",
  async (req, res): Promise<void> => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const orders = await db
        .select()
        .from(energieausweisOrdersTable)
        .where(eq(energieausweisOrdersTable.userId, userId))
        .orderBy(desc(energieausweisOrdersTable.createdAt));
      res.json(orders);
    } catch (err) {
      req.log.error({ err }, "Failed to list energieausweis orders");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
