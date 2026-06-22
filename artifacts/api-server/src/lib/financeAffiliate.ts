import { db } from "@workspace/db";
import {
  foerderschieneReportsTable,
  financePartnersTable,
  financeLeadsTable,
  type FinancePartner,
  type FinanceLead,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";
import { matchFoerderschiene, type MassnahmeEstimate } from "./foerderschiene";
import { sendFinanceLeadToPartner, wasEmailSent } from "./email";

/**
 * Förder-Affiliate — the 5th revenue stream. ADDITIVE to the booking
 * marketplace; it never touches commissions or provider tiers.
 *
 * When a funding-relevant Gebäudereport is PAID and its buyer gave a SEPARATE,
 * timestamped financing-offer consent, we match active finance partners by
 * region/PLZ + estimated investment, create exactly one idempotent lead per
 * (report, partner), email each matched partner once, and track a fixed
 * per-lead fee as revenue. NO lead is ever created or shared without an active
 * (non-revoked) consent.
 *
 * The consent proof (version + text + timestamp) and everything the partner
 * needs (buyer contact, building profile, recommended measures, estimated
 * investment) are snapshotted onto each lead at creation, so a lead stays a
 * complete, lawful audit record even if the report or partner later changes.
 */

/**
 * Estimate the total project investment (in cents) for a building profile from
 * the recommended measures. Prefers the à-la-carte sum of Einzelmaßnahmen;
 * falls back to the largest Komplettsanierung when no single measures apply.
 */
function estimateInvestmentCents(massnahmen: MassnahmeEstimate[]): number {
  const mid = (m: MassnahmeEstimate) => (m.kostenMin + m.kostenMax) / 2;
  const einzelSum = massnahmen
    .filter((m) => m.art === "einzelmassnahme")
    .reduce((sum, m) => sum + mid(m), 0);
  const komplettMid = massnahmen
    .filter((m) => m.art === "komplettsanierung")
    .reduce((max, m) => Math.max(max, mid(m)), 0);
  return Math.round(Math.max(einzelSum, komplettMid) * 100);
}

/**
 * Geo eligibility (P1): a partner with PLZ prefixes matches only when the
 * report PLZ starts with one of them. A partner without PLZ prefixes matches
 * only when it is nationwide (regions empty or contains "bundesweit") — a
 * region-restricted partner must therefore also set PLZ prefixes to match,
 * because the building profile carries a PLZ but no Bundesland (fail-closed).
 */
function geoMatches(partner: FinancePartner, plz: string): boolean {
  const prefixes = partner.postalPrefixes ?? [];
  if (prefixes.length > 0) {
    if (!plz) return false;
    return prefixes.some((pre) => plz.startsWith(pre));
  }
  const regions = partner.regions ?? [];
  return regions.length === 0 || regions.includes("bundesweit");
}

function investmentMatches(partner: FinancePartner, estCents: number): boolean {
  if (partner.minInvestmentCents != null && estCents < partner.minInvestmentCents)
    return false;
  if (partner.maxInvestmentCents != null && estCents > partner.maxInvestmentCents)
    return false;
  return true;
}

/**
 * Create finance leads for a paid + consented report, idempotently, then email
 * each newly matched partner once. Safe to call from BOTH the success-page
 * reconcile and the Stripe webhook; re-running never duplicates a lead row or a
 * partner email. Returns the number of leads created on this pass.
 *
 * Fire-and-forget at the call sites — a partner-email or matching failure must
 * never block report fulfillment or the webhook ack.
 */
export async function createFinanceLeadsForPaidReport(
  reportId: number,
): Promise<number> {
  const [report] = await db
    .select()
    .from(foerderschieneReportsTable)
    .where(eq(foerderschieneReportsTable.id, reportId))
    .limit(1);
  if (!report) return 0;

  // Consent gate — fail-closed. A lead is only ever created while the buyer's
  // financing-offer consent is present AND not revoked, the report is paid, and
  // we have a buyer email to hand to the partner.
  if (report.status !== "paid") return 0;
  if (!report.financeConsent) return 0;
  if (!report.financeConsentAt) return 0;
  if (report.financeConsentRevokedAt) return 0;
  if (!report.email) return 0;

  const profil = (report.profil ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const baujahr = num(profil["baujahr"]);
  const wohnflaeche = num(profil["wohnflaeche"]);
  const wohneinheiten =
    profil["wohneinheiten"] != null ? num(profil["wohneinheiten"]) : null;
  const heizung = String(profil["heizung"] ?? "");
  const plz = String(profil["plz"] ?? "").trim();

  const match = await matchFoerderschiene({
    baujahr,
    wohnflaeche,
    wohneinheiten,
    heizung,
    massnahmen: [],
    selbstgenutzt: null,
  });
  const estCents = estimateInvestmentCents(match.massnahmen);

  // Only funding-relevant reports (with a real investment) generate leads.
  if (estCents <= 0) {
    await db
      .update(foerderschieneReportsTable)
      .set({ financeLeadProcessedAt: new Date() })
      .where(eq(foerderschieneReportsTable.id, report.id));
    return 0;
  }

  const partners = await db
    .select()
    .from(financePartnersTable)
    .where(eq(financePartnersTable.active, true));

  const matched = partners.filter(
    (p) => geoMatches(p, plz) && investmentMatches(p, estCents),
  );

  let created = 0;
  for (const partner of matched) {
    const [inserted] = await db
      .insert(financeLeadsTable)
      .values({
        reportId: report.id,
        partnerId: partner.id,
        status: "created",
        feeCents: partner.feePerLeadCents,
        estimatedInvestmentCents: estCents,
        buyerEmail: report.email,
        buyerName: null,
        adresse: report.adresse,
        postalCode: plz || null,
        region: null,
        profil: report.profil,
        massnahmen: match.massnahmen,
        consentVersion: report.financeConsentVersion,
        consentText: report.financeConsentText,
        consentAt: report.financeConsentAt,
      })
      .onConflictDoNothing({
        target: [financeLeadsTable.reportId, financeLeadsTable.partnerId],
      })
      .returning();
    if (inserted) created += 1;
  }

  await db
    .update(foerderschieneReportsTable)
    .set({ financeLeadProcessedAt: new Date() })
    .where(eq(foerderschieneReportsTable.id, report.id));

  // Email matched partners once each (deduped via email_log). Done after all
  // inserts so a retry only ever sends still-unsent leads.
  await emailPendingLeadsForReport(report.id);

  return created;
}

/**
 * Email every still-"created" lead of a report to its partner exactly once.
 *
 * Claim-then-send: each lead is atomically CAS'd from "created" -> "sending"
 * before the email goes out, so when the Stripe webhook and the success-page
 * reconcile run concurrently only ONE of them ever wins the claim and sends a
 * given lead's partner email (the loser's UPDATE matches no row and skips).
 * `wasEmailSent` is an additional cross-invocation backstop (restarts / Stripe
 * redeliveries). On send failure the claim is reverted "sending" -> "created"
 * so a later webhook/reconcile retry can re-claim and resend.
 *
 * A hard crash between claim and send/revert leaves the lead in "sending"
 * (at-most-once preserved — never a duplicate partner email); such a stalled
 * lead is visible in the admin list for manual follow-up.
 */
async function emailPendingLeadsForReport(reportId: number): Promise<void> {
  const rows = await db
    .select({ lead: financeLeadsTable, partner: financePartnersTable })
    .from(financeLeadsTable)
    .innerJoin(
      financePartnersTable,
      eq(financeLeadsTable.partnerId, financePartnersTable.id),
    )
    .where(
      and(
        eq(financeLeadsTable.reportId, reportId),
        eq(financeLeadsTable.status, "created"),
      ),
    );

  for (const { lead, partner } of rows) {
    // Atomic claim — only the caller that flips created -> sending proceeds.
    const [claimed] = await db
      .update(financeLeadsTable)
      .set({ status: "sending", updatedAt: new Date() })
      .where(
        and(
          eq(financeLeadsTable.id, lead.id),
          eq(financeLeadsTable.status, "created"),
        ),
      )
      .returning({ id: financeLeadsTable.id });
    if (!claimed) continue;

    try {
      // Backstop: if a prior invocation already logged this email, advance the
      // status without sending again.
      if (!(await wasEmailSent("finance_lead_partner", lead.id))) {
        await sendFinanceLeadToPartner({
          partnerEmail: partner.contactEmail,
          partnerName: partner.name,
          buyerEmail: lead.buyerEmail,
          adresse: lead.adresse,
          postalCode: lead.postalCode,
          estimatedInvestmentCents: lead.estimatedInvestmentCents,
          massnahmen: (lead.massnahmen as MassnahmeEstimate[] | null) ?? [],
          leadId: lead.id,
        });
      }
      await db
        .update(financeLeadsTable)
        .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
        .where(eq(financeLeadsTable.id, lead.id));
    } catch (err) {
      // Revert the claim so a later retry can resend.
      await db
        .update(financeLeadsTable)
        .set({ status: "created", updatedAt: new Date() })
        .where(
          and(
            eq(financeLeadsTable.id, lead.id),
            eq(financeLeadsTable.status, "sending"),
          ),
        );
      logger.error(
        { err, leadId: lead.id },
        "finance lead partner email failed",
      );
    }
  }
}

export type { FinanceLead, FinancePartner };
