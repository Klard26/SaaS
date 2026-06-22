// ═══════════════════════════════════════════════════════════════
// Klard — End-to-End-Test: Anfrage → Match → (anonym) → Angebot →
//         Kontakt sichtbar → Annahme → Lead-Garantie
// Läuft gegen echtes PostgreSQL. Bildet die Logik der Routes nach
// (inkl. anonymizeRequest) und prüft sie mit Assertions.
// ═══════════════════════════════════════════════════════════════
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  host: "/tmp", port: 5433, user: "postgres", database: "klard",
});

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { console.log("  ✓ " + msg); passed++; }
  else { console.log("  ✗ FAIL: " + msg); failed++; }
}

// — Nachbildung von anonymizeRequest aus providerRequests.js —
function anonymizeRequest(row, hasOffered) {
  const base = {
    id: row.id, title: row.title, postal_code: row.postal_code,
    city: row.city, urgency: row.urgency, funding_relevant: row.funding_relevant,
    status: row.status, contact_unlocked: hasOffered,
  };
  if (hasOffered) {
    base.customer_name = row.customer_name;
    base.customer_email = row.customer_email;
    base.customer_phone = row.customer_phone;
  }
  return base;
}

function calcLeadPrice({ funding_relevant, budget_max, branch_id }) {
  let base = 4.9;
  if (funding_relevant) base += 3;
  if (budget_max && budget_max > 2000) base += 4;
  if (budget_max && budget_max > 10000) base += 6;
  if (["enb", "stat", "bauphysik"].includes(branch_id)) base += 2;
  return Math.round(base * 100) / 100;
}

async function getProviderRequests(providerId) {
  const r = await pool.query(
    `SELECT rq.*, (o.id IS NOT NULL) AS has_offered
     FROM requests rq
     JOIN request_matches rm ON rm.request_id = rq.id AND rm.provider_id = $1
     LEFT JOIN offers o ON o.request_id = rq.id AND o.provider_id = $1
     WHERE rq.status IN ('open','matched')
     ORDER BY rq.created_at DESC`, [providerId]);
  return r.rows.map(row => anonymizeRequest(row, row.has_offered));
}

async function main() {
  console.log("\n═══ KLARD E2E-TEST ═══\n");

  // ── Setup: Seed-Daten ──────────────────────────────────────
  console.log("Setup: Branche, Leistung, Anbieter, Wallet");
  await pool.query(`INSERT INTO branches (id,name) VALUES ('enb','Energieberatung') ON CONFLICT DO NOTHING`);
  const cat = await pool.query(
    `INSERT INTO service_categories (branch_id,name) VALUES ('enb','Sanierungsfahrplan') RETURNING id`);
  const catId = cat.rows[0].id;
  const tpl = await pool.query(
    `INSERT INTO service_templates (category_id,name,price_min,price_avg,price_max,fundable)
     VALUES ($1,'iSFP',1300,1700,2500,'BAFA 80%') RETURNING id`, [catId]);
  const tplId = tpl.rows[0].id;

  const prov = await pool.query(
    `INSERT INTO providers (contact_name,email,is_active)
     VALUES ('Energie Impuls GmbH','anbieter@example.de',TRUE) RETURNING id`);
  const providerId = prov.rows[0].id;
  await pool.query(
    `INSERT INTO provider_services (provider_id,service_template_id,price) VALUES ($1,$2,1700)`,
    [providerId, tplId]);
  // Wallet mit Startguthaben
  await pool.query(
    `INSERT INTO provider_wallet (provider_id,balance) VALUES ($1,50)`, [providerId]);
  console.log("  ✓ Seed angelegt\n");

  // ── Schritt 1: Kunde stellt Anfrage ────────────────────────
  console.log("Schritt 1: Kunde stellt förderrelevante Anfrage");
  const reqIns = await pool.query(
    `INSERT INTO requests
      (customer_name,customer_email,customer_phone,branch_id,category_id,
       service_template_id,title,description,answers,postal_code,city,
       budget_max,urgency,funding_relevant,max_offers,consent_data_share,consent_timestamp)
     VALUES ('Max Mustermann','max@privat.de','030-123456','enb',$1,$2,
             'iSFP Einfamilienhaus','Baujahr 1962',$3,'10115','Berlin',
             2500,'2_wochen',TRUE,3,TRUE,now())
     RETURNING *`,
    [catId, tplId, JSON.stringify({ baujahr: "1962", wohnflaeche_qm: "140" })]);
  const request = reqIns.rows[0];
  assert(request.id, "Anfrage angelegt");
  assert(request.consent_data_share === true, "DSGVO-Einwilligung gespeichert");
  assert(request.funding_relevant === true, "Als förderrelevant markiert");

  // Matching
  await pool.query(
    `INSERT INTO request_matches (request_id,provider_id,match_score)
     VALUES ($1,$2,10)`, [request.id, providerId]);
  const matchCount = await pool.query(
    `SELECT COUNT(*)::int n FROM request_matches WHERE request_id=$1`, [request.id]);
  assert(matchCount.rows[0].n === 1, "Anbieter gematcht");
  console.log("");

  // ── Schritt 2: Anbieter sieht Anfrage ANONYMISIERT ─────────
  console.log("Schritt 2: Anbieter ruft Anfragen ab (vor Angebot)");
  let list = await getProviderRequests(providerId);
  assert(list.length === 1, "Anfrage erscheint in Liste");
  const before = list[0];
  assert(before.contact_unlocked === false, "contact_unlocked = false");
  assert(before.customer_name === undefined, "Name NICHT sichtbar (anonym)");
  assert(before.customer_phone === undefined, "Telefon NICHT sichtbar (anonym)");
  assert(before.postal_code === "10115" && before.city === "Berlin",
    "PLZ/Stadt sichtbar (für Umkreis)");
  console.log("");

  // ── Schritt 3: Anbieter sendet Angebot (Lead-Gebühr) ───────
  console.log("Schritt 3: Anbieter sendet Angebot");
  const leadPrice = calcLeadPrice(request); // enb + funding + budget>2000 = 4.9+2+3+4 = 13.9
  assert(leadPrice === 13.9, `Lead-Preis korrekt berechnet (${leadPrice} €)`);

  const client = await pool.connect();
  let offerId, leadFeeId;
  try {
    await client.query("BEGIN");
    const w = await client.query(
      `SELECT balance FROM provider_wallet WHERE provider_id=$1 FOR UPDATE`, [providerId]);
    const newBal = Number(w.rows[0].balance) - leadPrice;
    await client.query(
      `UPDATE provider_wallet SET balance=$1 WHERE provider_id=$2`, [newBal, providerId]);
    await client.query(
      `INSERT INTO wallet_transactions (provider_id,type,amount,balance_after,reference_id,note)
       VALUES ($1,'lead_charge',$2,$3,$4,'Lead')`,
      [providerId, -leadPrice, newBal, request.id]);
    const lf = await client.query(
      `INSERT INTO lead_fees (provider_id,request_id,amount,paid_from_credit,status)
       VALUES ($1,$2,$3,TRUE,'paid') RETURNING id`, [providerId, request.id, leadPrice]);
    leadFeeId = lf.rows[0].id;
    const o = await client.query(
      `INSERT INTO offers (request_id,provider_id,lead_fee_id,price,price_type,message)
       VALUES ($1,$2,$3,1700,'fixed','Gerne erstelle ich Ihren iSFP.') RETURNING id`,
      [request.id, providerId, leadFeeId]);
    offerId = o.rows[0].id;
    await client.query("COMMIT");
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }

  const wbal = await pool.query(
    `SELECT balance FROM provider_wallet WHERE provider_id=$1`, [providerId]);
  assert(Number(wbal.rows[0].balance) === 36.1, `Wallet abgebucht (50 → 36.10 €)`);
  assert(offerId, "Angebot erstellt");
  console.log("");

  // ── Schritt 4: Jetzt sind Kontaktdaten SICHTBAR ────────────
  console.log("Schritt 4: Anbieter ruft Anfrage erneut ab (nach Angebot)");
  list = await getProviderRequests(providerId);
  const after = list[0];
  assert(after.contact_unlocked === true, "contact_unlocked = true");
  assert(after.customer_name === "Max Mustermann", "Name JETZT sichtbar");
  assert(after.customer_email === "max@privat.de", "E-Mail JETZT sichtbar");
  assert(after.customer_phone === "030-123456", "Telefon JETZT sichtbar");
  console.log("");

  // ── Schritt 5: Kunde nimmt Angebot an ──────────────────────
  console.log("Schritt 5: Kunde nimmt Angebot an");
  await pool.query(`UPDATE offers SET status='accepted',responded_at=now() WHERE id=$1`, [offerId]);
  await pool.query(`UPDATE requests SET status='fulfilled' WHERE id=$1`, [request.id]);
  const acc = await pool.query(`SELECT status FROM offers WHERE id=$1`, [offerId]);
  assert(acc.rows[0].status === "accepted", "Angebot angenommen");
  const rstat = await pool.query(`SELECT status FROM requests WHERE id=$1`, [request.id]);
  assert(rstat.rows[0].status === "fulfilled", "Anfrage als erfüllt markiert");
  console.log("");

  // ── Schritt 6: Lead-Garantie (Refund-Mechanik) ─────────────
  console.log("Schritt 6: Lead-Garantie — Refund bei totem Lead");
  const refClient = await pool.connect();
  try {
    await refClient.query("BEGIN");
    const lf = await refClient.query(`SELECT * FROM lead_fees WHERE id=$1 FOR UPDATE`, [leadFeeId]);
    const fee = lf.rows[0];
    const w = await refClient.query(
      `SELECT balance FROM provider_wallet WHERE provider_id=$1 FOR UPDATE`, [fee.provider_id]);
    const newBal = Number(w.rows[0].balance) + Number(fee.amount);
    await refClient.query(
      `UPDATE provider_wallet SET balance=$1 WHERE provider_id=$2`, [newBal, fee.provider_id]);
    await refClient.query(
      `INSERT INTO wallet_transactions (provider_id,type,amount,balance_after,reference_id,note)
       VALUES ($1,'refund',$2,$3,$4,'Lead-Garantie')`,
      [fee.provider_id, fee.amount, newBal, fee.request_id]);
    await refClient.query(
      `UPDATE lead_fees SET status='refunded',refund_reason='Test' WHERE id=$1`, [leadFeeId]);
    await refClient.query("COMMIT");
  } catch (e) { await refClient.query("ROLLBACK"); throw e; }
  finally { refClient.release(); }
  const wbal2 = await pool.query(
    `SELECT balance FROM provider_wallet WHERE provider_id=$1`, [providerId]);
  assert(Number(wbal2.rows[0].balance) === 50, "Lead-Gebühr erstattet (36.10 → 50 €)");
  console.log("");

  // ── Schritt 7: Förder-Affiliate-Lead ───────────────────────
  console.log("Schritt 7: Förder-Affiliate (5. Umsatzstrom)");
  const partner = await pool.query(
    `INSERT INTO finance_partners (name,type,contact_email,payout_per_lead,region_prefixes)
     VALUES ('Sparkasse Berlin','bank','partner@bank.de',45,ARRAY['10','12']) RETURNING id`);
  const partnerId = partner.rows[0].id;
  // Region-Match: PLZ 10115 beginnt mit '10' → Treffer
  const fl = await pool.query(
    `INSERT INTO finance_leads (request_id,partner_id,consent_finance,consent_timestamp,payout_amount,status)
     VALUES ($1,$2,TRUE,now(),45,'sent') RETURNING id`, [request.id, partnerId]);
  assert(fl.rows[0].id, "Förder-Lead an Region-Partner vermittelt");
  // Conversion
  await pool.query(
    `UPDATE finance_leads SET status='converted',converted_at=now() WHERE id=$1`, [fl.rows[0].id]);
  const rev = await pool.query(
    `SELECT conversions, revenue_pending FROM finance_revenue WHERE partner_id=$1`, [partnerId]);
  assert(Number(rev.rows[0].conversions) === 1, "Conversion im Umsatz-View gezählt");
  console.log("");

  // ── Ergebnis ───────────────────────────────────────────────
  console.log("═══════════════════════════════");
  console.log(`Ergebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  console.log("═══════════════════════════════\n");
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("Test-Fehler:", e); process.exit(1); });
