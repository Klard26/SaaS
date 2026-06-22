// ═══════════════════════════════════════════════════════════════
// Klard — Anbieter-seitige Anfrage-Routes mit Anonymisierung
// Datei: src/routes/providerRequests.js
//
// Setzt die DSGVO-Zusage SERVERSEITIG durch:
// Name + Telefon eines Kunden werden einem Anbieter NUR dann
// ausgeliefert, wenn dieser Anbieter bereits ein Angebot (offer)
// für die jeweilige Anfrage abgegeben hat. Vorher: nur PLZ/Stadt.
// ═══════════════════════════════════════════════════════════════
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Anonymisierungs-Helfer: entscheidet pro Anfrage, ob Kontaktdaten
// sichtbar sind, und entfernt sie sonst aus dem Objekt.
function anonymizeRequest(row, hasOffered) {
  const base = {
    id: row.id,
    branch_id: row.branch_id,
    category_id: row.category_id,
    service_template_id: row.service_template_id,
    title: row.title,
    description: row.description,
    answers: row.answers,
    postal_code: row.postal_code,
    city: row.city,
    budget_min: row.budget_min,
    budget_max: row.budget_max,
    urgency: row.urgency,
    funding_relevant: row.funding_relevant,
    status: row.status,
    created_at: row.created_at,
    contact_unlocked: hasOffered,
  };
  if (hasOffered) {
    base.customer_name = row.customer_name;
    base.customer_email = row.customer_email;
    base.customer_phone = row.customer_phone;
  }
  return base;
}

// ─── GET /api/providers/:providerId/requests ───────────────────
// Liste der zu diesem Anbieter passenden Anfragen (anonymisiert,
// solange kein eigenes Angebot vorliegt).
router.get("/providers/:providerId/requests", async (req, res) => {
  const { providerId } = req.params;
  try {
    const r = await pool.query(
      `SELECT rq.*,
              (o.id IS NOT NULL) AS has_offered
       FROM requests rq
       JOIN request_matches rm
         ON rm.request_id = rq.id AND rm.provider_id = $1
       LEFT JOIN offers o
         ON o.request_id = rq.id AND o.provider_id = $1
       WHERE rq.status IN ('open','matched')
       ORDER BY rq.created_at DESC`,
      [providerId]);
    const requests = r.rows.map(row => anonymizeRequest(row, row.has_offered));
    res.json(requests);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/providers/:providerId/requests/:requestId ────────
// Einzelne Anfrage — gleiche Anonymisierungs-Regel.
router.get("/providers/:providerId/requests/:requestId", async (req, res) => {
  const { providerId, requestId } = req.params;
  try {
    // Anbieter muss zur Anfrage gematcht sein (kein blindes Abrufen fremder Anfragen)
    const r = await pool.query(
      `SELECT rq.*,
              (o.id IS NOT NULL) AS has_offered
       FROM requests rq
       JOIN request_matches rm
         ON rm.request_id = rq.id AND rm.provider_id = $1
       LEFT JOIN offers o
         ON o.request_id = rq.id AND o.provider_id = $1
       WHERE rq.id = $2`,
      [providerId, requestId]);
    if (!r.rows.length)
      return res.status(404).json({ error: "Anfrage nicht gefunden oder nicht für Sie freigegeben." });

    // viewed_at im Match setzen (für Statistik/Response-Rate)
    await pool.query(
      `UPDATE request_matches SET viewed_at = COALESCE(viewed_at, now())
       WHERE request_id = $1 AND provider_id = $2`, [requestId, providerId]);

    res.json(anonymizeRequest(r.rows[0], r.rows[0].has_offered));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export { anonymizeRequest };
export default router;
