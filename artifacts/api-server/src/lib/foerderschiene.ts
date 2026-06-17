import { db } from "@workspace/db";
import {
  foerderProgrammeTable,
  foerderschieneReportsTable,
  energieausweisOrdersTable,
  type FoerderProgramm,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";

/** One-time price for the detailed Gebäudereport PDF (in cents). */
export const REPORT_PRICE_CENTS = 4900;

/** Energieausweis order prices by type (in cents). Fulfilled by a certified
 *  Aussteller — Förderschiene only collects intake + payment. */
export const ENERGIEAUSWEIS_PRICES: Record<string, number> = {
  verbrauch: 7900,
  bedarf: 14900,
};

export function energieausweisPrice(typ: string): number | null {
  return ENERGIEAUSWEIS_PRICES[typ] ?? null;
}

/**
 * Förderprogramm catalogue. Flattened from the Förderpilot classification
 * schema (amtliche Stammdaten). `tags` drive the building-profile matching.
 */
export const FOERDER_PROGRAMME_SEED: Omit<FoerderProgramm, "createdAt">[] = [
  {
    id: "beg-em-heizung-kfw458",
    titel: "BEG Einzelmaßnahmen – Heizungstausch (KfW 458)",
    foerdergeber: "KfW",
    ebene: "bund",
    art: "zuschuss",
    timing: "vor_vorhabenbeginn",
    foerderquoteText: "30 % Grundförderung + Boni, gedeckelt bei 70 %",
    quoteMax: 70,
    maxBetragText: "max. 30.000 € förderf. Kosten/WE → bis 21.000 € Zuschuss",
    maxBetragEur: 21000,
    kurzbeschreibung:
      "Zuschuss für den Austausch fossiler Heizungen durch klimafreundliche Systeme (Wärmepumpe, Pellet, Solarthermie, Biomasse).",
    besonderheit:
      "Antrag auch durch Heizungsbauer möglich; Einkommensbonus 30 % bis 40.000 € zvE. Antrag VOR Auftragsvergabe.",
    quelleUrl: "https://www.kfw.de",
    erfolgsquote: 78,
    tags: ["heizung"],
    region: "bundesweit",
    aktiv: true,
  },
  {
    id: "beg-em-huelle-bafa",
    titel: "BEG Einzelmaßnahmen – Gebäudehülle (BAFA)",
    foerdergeber: "BAFA",
    ebene: "bund",
    art: "zuschuss",
    timing: "vor_vorhabenbeginn",
    foerderquoteText: "15 % + 5 % iSFP-Bonus = 20 %",
    quoteMax: 20,
    maxBetragText: "max. 60.000 € förderf. Kosten/WE/Jahr (mit iSFP)",
    maxBetragEur: 12000,
    kurzbeschreibung:
      "Zuschuss für Dämmung von Fassade, Dach, Kellerdecke und für den Fenstertausch.",
    besonderheit:
      "Der iSFP-Bonus (5 %) setzt einen individuellen Sanierungsfahrplan voraus.",
    quelleUrl: "https://www.bafa.de",
    erfolgsquote: 82,
    tags: ["daemmung", "fenster"],
    region: "bundesweit",
    aktiv: true,
  },
  {
    id: "kfw-261-effizienzhaus",
    titel: "Wohngebäude – Kredit Effizienzhaus (KfW 261)",
    foerdergeber: "KfW",
    ebene: "bund",
    art: "kredit",
    timing: "vor_vorhabenbeginn",
    foerderquoteText: "Tilgungszuschuss bis 45 %",
    quoteMax: 45,
    maxBetragText: "max. 150.000 € Kredit pro Wohneinheit",
    maxBetragEur: 67500,
    kurzbeschreibung:
      "Kreditförderung für die Sanierung zum Effizienzhaus 85, 70, 55, 40 oder Denkmal.",
    besonderheit:
      "Energieeffizienz-Experte (dena-Liste) verpflichtend. Höchster Zuschuss bei EH 40 EE.",
    quelleUrl: "https://www.kfw.de",
    erfolgsquote: 71,
    tags: ["komplett"],
    region: "bundesweit",
    aktiv: true,
  },
  {
    id: "estg-35c-steuerbonus",
    titel: "§ 35c EStG – Steuerbonus energetische Sanierung",
    foerdergeber: "Finanzamt",
    ebene: "bund",
    art: "steuer",
    timing: "laufend",
    foerderquoteText: "20 % verteilt auf 3 Jahre",
    quoteMax: 20,
    maxBetragText: "max. 40.000 € Steuerermäßigung pro Objekt",
    maxBetragEur: 40000,
    kurzbeschreibung:
      "Steuerermäßigung für energetische Einzelmaßnahmen bei selbstgenutztem Wohneigentum.",
    besonderheit:
      "Nicht kombinierbar mit BAFA/KfW-Förderung für dieselbe Maßnahme. Nur selbstgenutzt.",
    quelleUrl: "https://www.bundesfinanzministerium.de",
    erfolgsquote: 90,
    tags: ["heizung", "daemmung", "fenster", "steuer"],
    region: "bundesweit",
    aktiv: true,
  },
  {
    id: "isfp-bafa-beratung",
    titel: "Energieberatung Wohngebäude / iSFP (BAFA)",
    foerdergeber: "BAFA",
    ebene: "bund",
    art: "beratung",
    timing: "vor_vorhabenbeginn",
    foerderquoteText: "50 % Zuschuss zum Beratungshonorar",
    quoteMax: 50,
    maxBetragText: "max. 650 € (EFH/ZFH), 850 € (MFH ab 3 WE)",
    maxBetragEur: 850,
    kurzbeschreibung:
      "Geförderter individueller Sanierungsfahrplan (iSFP) durch einen zertifizierten Energieberater.",
    besonderheit:
      "Der iSFP schaltet zusätzlich den 5 %-iSFP-Bonus bei BEG-Einzelmaßnahmen frei.",
    quelleUrl: "https://www.bafa.de",
    erfolgsquote: 88,
    tags: ["beratung"],
    region: "bundesweit",
    aktiv: true,
  },
  {
    id: "beg-em-pv-anlagentechnik",
    titel: "BEG EM – Anlagentechnik & Solarthermie (BAFA)",
    foerdergeber: "BAFA",
    ebene: "bund",
    art: "zuschuss",
    timing: "vor_vorhabenbeginn",
    foerderquoteText: "15 % + 5 % iSFP-Bonus",
    quoteMax: 20,
    maxBetragText: "max. 60.000 € förderf. Kosten/WE/Jahr",
    maxBetragEur: 12000,
    kurzbeschreibung:
      "Zuschuss für Lüftungsanlagen mit Wärmerückgewinnung, Solarthermie und sommerlichen Wärmeschutz.",
    besonderheit:
      "Photovoltaik selbst wird über das EEG (Einspeisevergütung) vergütet, nicht über BEG.",
    quelleUrl: "https://www.bafa.de",
    erfolgsquote: 80,
    tags: ["pv", "heizung"],
    region: "bundesweit",
    aktiv: true,
  },
];

/**
 * Recommended measures (Einzelmaßnahmen + Komplettsanierungen) with cost
 * estimates at current market conditions. Costs are computed from the living
 * area where it scales with surface; fixed-price items use min/max directly.
 */
interface MassnahmeDef {
  id: string;
  label: string;
  art: "einzelmassnahme" | "komplettsanierung";
  tags: string[];
  einsparung: string;
  beschreibung: string;
  /** € per m² of living area (min/max), or null for fixed price. */
  proM2?: [number, number];
  fix?: [number, number];
}

const MASSNAHMEN: MassnahmeDef[] = [
  {
    id: "waermepumpe",
    label: "Wärmepumpe (Heizungstausch)",
    art: "einzelmassnahme",
    tags: ["heizung"],
    einsparung: "ca. 1.500–2.500 € Heizkosten/Jahr",
    beschreibung:
      "Austausch der fossilen Heizung gegen eine Luft- oder Sole-Wärmepumpe inkl. hydraulischem Abgleich.",
    fix: [22000, 38000],
  },
  {
    id: "fassadendaemmung",
    label: "Fassadendämmung (WDVS)",
    art: "einzelmassnahme",
    tags: ["daemmung"],
    einsparung: "ca. 15–25 % Heizenergie",
    beschreibung:
      "Wärmedämmverbundsystem auf der Außenfassade, größter Hebel bei ungedämmten Altbauten.",
    proM2: [180, 280],
  },
  {
    id: "dachdaemmung",
    label: "Dach- / Oberste-Geschossdecke-Dämmung",
    art: "einzelmassnahme",
    tags: ["daemmung"],
    einsparung: "ca. 7–15 % Heizenergie",
    beschreibung:
      "Dämmung der obersten Geschossdecke oder des Steildachs zwischen/auf den Sparren.",
    proM2: [60, 120],
  },
  {
    id: "fenster",
    label: "Fenstertausch (3-fach-Verglasung)",
    art: "einzelmassnahme",
    tags: ["fenster"],
    einsparung: "ca. 10–15 % Heizenergie",
    beschreibung:
      "Austausch alter Fenster gegen moderne 3-fach-verglaste Fenster mit gedämmten Rahmen.",
    proM2: [80, 140],
  },
  {
    id: "pv-anlage",
    label: "Photovoltaik-Anlage inkl. Speicher",
    art: "einzelmassnahme",
    tags: ["pv"],
    einsparung: "ca. 800–1.400 € Stromkosten/Jahr",
    beschreibung:
      "PV-Anlage (8–12 kWp) mit Batteriespeicher zur Eigenstromnutzung.",
    fix: [14000, 24000],
  },
  {
    id: "komplettsanierung-eh55",
    label: "Komplettsanierung Effizienzhaus 55",
    art: "komplettsanierung",
    tags: ["komplett", "heizung", "daemmung", "fenster"],
    einsparung: "ca. 60–75 % Endenergie",
    beschreibung:
      "Vollsanierung von Hülle und Anlagentechnik auf den Standard Effizienzhaus 55 — höchste Förderquote über KfW 261.",
    proM2: [900, 1400],
  },
];

function fmtEur(n: number): number {
  return Math.round(n / 100) * 100;
}

export interface MassnahmeEstimate {
  id: string;
  label: string;
  art: "einzelmassnahme" | "komplettsanierung";
  kostenMin: number;
  kostenMax: number;
  einsparung: string;
  beschreibung: string;
  tags: string[];
}

export interface MatchInput {
  baujahr: number;
  wohnflaeche: number;
  wohneinheiten?: number | null;
  heizung: string;
  massnahmen?: string[];
  selbstgenutzt?: boolean | null;
}

export interface MatchResult {
  programme: FoerderProgramm[];
  massnahmen: MassnahmeEstimate[];
  geschaetzteFoerderungEur: number;
}

/**
 * Building-profile → eligible programs + recommended measures with cost
 * estimates. Selects relevant measure tags from the profile (old heating →
 * heizung, old building → daemmung/fenster, plus any explicit selections),
 * estimates costs from the living area, then filters programs by overlapping
 * tags and sums a rough achievable subsidy.
 */
export async function matchFoerderschiene(
  input: MatchInput,
): Promise<MatchResult> {
  const flaeche = Math.max(20, input.wohnflaeche || 0);
  const tags = new Set<string>(input.massnahmen ?? []);

  const fossilHeating = ["gas", "oel", "kohle", "nachtspeicher"];
  if (fossilHeating.includes(input.heizung)) tags.add("heizung");
  if (input.baujahr && input.baujahr < 1995) {
    tags.add("daemmung");
    tags.add("fenster");
  }
  if (input.baujahr && input.baujahr < 1979) tags.add("komplett");
  if (tags.size === 0) tags.add("heizung");

  const massnahmen: MassnahmeEstimate[] = MASSNAHMEN.filter((m) =>
    m.tags.some((t) => tags.has(t)),
  ).map((m) => {
    let min: number;
    let max: number;
    if (m.proM2) {
      min = fmtEur(m.proM2[0] * flaeche);
      max = fmtEur(m.proM2[1] * flaeche);
    } else if (m.fix) {
      min = m.fix[0];
      max = m.fix[1];
    } else {
      min = 0;
      max = 0;
    }
    return {
      id: m.id,
      label: m.label,
      art: m.art,
      kostenMin: min,
      kostenMax: max,
      einsparung: m.einsparung,
      beschreibung: m.beschreibung,
      tags: m.tags,
    };
  });

  const all = await listProgramme();
  const programme = all.filter((p) => {
    if (p.tags.includes("beratung")) return true; // beratung always relevant
    if (p.art === "steuer" && input.selbstgenutzt === false) return false;
    return p.tags.some((t) => tags.has(t));
  });

  // Rough achievable subsidy: 30 % of the median estimated investment of the
  // recommended Einzelmaßnahmen, capped at the highest program ceiling.
  const investMedian = massnahmen
    .filter((m) => m.art === "einzelmassnahme")
    .reduce((sum, m) => sum + (m.kostenMin + m.kostenMax) / 2, 0);
  const cap = Math.max(
    0,
    ...programme.map((p) => p.maxBetragEur ?? 0),
  );
  const geschaetzteFoerderungEur = fmtEur(
    Math.min(investMedian * 0.3, cap || investMedian * 0.3),
  );

  return { programme, massnahmen, geschaetzteFoerderungEur };
}

let seeded = false;

/** Idempotently seed the program catalogue (runs once per process). */
export async function ensureProgrammeSeeded(): Promise<void> {
  if (seeded) return;
  for (const p of FOERDER_PROGRAMME_SEED) {
    await db
      .insert(foerderProgrammeTable)
      .values(p)
      .onConflictDoNothing({ target: foerderProgrammeTable.id });
  }
  seeded = true;
}

export async function listProgramme(): Promise<FoerderProgramm[]> {
  await ensureProgrammeSeeded();
  return db
    .select()
    .from(foerderProgrammeTable)
    .where(eq(foerderProgrammeTable.aktiv, true));
}

/** Idempotently mark a report paid. Returns true if it transitioned. */
export async function fulfillReport(sessionId: string): Promise<boolean> {
  const [updated] = await db
    .update(foerderschieneReportsTable)
    .set({ status: "paid", paidAt: new Date() })
    .where(
      sql`${foerderschieneReportsTable.sessionId} = ${sessionId} AND ${foerderschieneReportsTable.status} <> 'paid'`,
    )
    .returning();
  return !!updated;
}

/** Idempotently mark an Energieausweis order paid + queued for the issuer. */
export async function fulfillEnergieausweis(sessionId: string): Promise<boolean> {
  const [updated] = await db
    .update(energieausweisOrdersTable)
    .set({ status: "in_bearbeitung", paidAt: new Date() })
    .where(
      sql`${energieausweisOrdersTable.sessionId} = ${sessionId} AND ${energieausweisOrdersTable.status} = 'pending_payment'`,
    )
    .returning();
  return !!updated;
}
