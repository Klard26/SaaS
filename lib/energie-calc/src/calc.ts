import { ageBand, BPI, BT, EC, HT, INS, PEF, plzKlima, plzPreisIndex, WI } from "./constants";
import type {
  BuildingInput,
  EnergyResult,
  ESGResult,
  RenovationMassnahme,
  RenovationSzenario,
  RestnutzungResult,
  RiskResult,
  SolarResult,
  ValueResult,
  WertResult,
} from "./types";

const HEUTE = new Date().getFullYear();

/**
 * Stark vereinfachte Energiebilanz auf Basis von DIN V 18599 / GEG 2024.
 * Keine offizielle Berechnung — dient nur der orientierenden Schnelleinschätzung.
 */
export function calcEnergie(d: BuildingInput): EnergyResult {
  const ag = ageBand(d.baujahr);
  const h = HT.find((x) => x.id === d.heizung) ?? HT[1]!;
  const ins = INS.find((x) => x.id === d.daemmung) ?? INS[0]!;
  const wi = WI.find((x) => x.id === d.fenster) ?? WI[1]!;
  const cl = plzKlima(d.plz);

  const geschossHoehe = 2.8;
  const grundflaeche = d.wohnflaeche / Math.max(d.geschosse, 1);
  const umfang = 4 * Math.sqrt(grundflaeche);
  const wandflaeche = umfang * d.geschosse * geschossHoehe;
  const fensterflaeche = wandflaeche * 0.2;
  const opakeWandflaeche = wandflaeche * 0.8;

  const uW = ag.uw * ins.f;
  const uR = ag.ur * ins.f;
  const uF = ag.uf * ins.f;
  const uWN = wi.u;

  // Transmissions-Verluste (Heiztage * dT in kWh/(m²·a))
  const heizGradTage = (cl.d * (20 - cl.t)) / 1000;
  const transmission =
    (opakeWandflaeche * uW + grundflaeche * uR + grundflaeche * uF + fensterflaeche * uWN) * heizGradTage;

  // Lüftung n50 ~ 0.5/h
  const luftvolumen = d.wohnflaeche * geschossHoehe;
  const lueftung = luftvolumen * 0.5 * 0.34 * heizGradTage;

  const verluste = transmission + lueftung;
  const solareGewinne = fensterflaeche * wi.g * 100; // grobe Schätzung
  const interneGewinne = d.wohnflaeche * 22;
  const heizwaerme = Math.max(0, verluste - 0.95 * (solareGewinne + interneGewinne));

  const endenergieAbsolut = heizwaerme / Math.max(h.e, 0.1) + d.wohnflaeche * 12; // + Warmwasser
  const endenergie = Math.round(endenergieAbsolut / d.wohnflaeche);
  const primaerenergie = Math.round(endenergie * (PEF[h.f]?.fp ?? 1.1));
  const co2Pro_m2 = Math.round(endenergie * (PEF[h.f]?.co2 ?? 0.24) * 10) / 10;
  const co2Tonnen = Math.round((co2Pro_m2 * d.wohnflaeche) / 100) / 10;

  const klasse = EC.find((c) => endenergie <= c.m) ?? EC[EC.length - 1]!;
  const htP = Math.round((opakeWandflaeche * uW + grundflaeche * uR + fensterflaeche * uWN) * 10) / 10;

  const pflichten: string[] = [];
  if (klasse.c === "F" || klasse.c === "G" || klasse.c === "H") {
    pflichten.push("Nach GEG § 47/48: Sanierungspflicht bei Eigentümerwechsel (oberste Geschossdecke, Heizung > 30 J).");
  }
  if (h.id === "gas_kt" && d.heizungBaujahr && HEUTE - d.heizungBaujahr > 30) {
    pflichten.push("Heizung älter als 30 Jahre — Austauschpflicht nach GEG § 72.");
  }
  if (klasse.c === "H") {
    pflichten.push("Sehr hoher Verbrauch — energetische Sanierung dringend empfohlen.");
  }

  return {
    endenergie,
    primaerenergie,
    klasse,
    co2Pro_m2,
    co2Tonnen,
    qH: Math.round(heizwaerme),
    htP,
    uW: Math.round(uW * 100) / 100,
    uWN,
    pflichten,
  };
}

export function calcWert(d: BuildingInput): WertResult {
  const nhkPerType: Record<string, number> = {
    efh: 1520, dhh: 1420, rh: 1350, mfh_s: 1280, mfh_m: 1220, mfh_l: 1180,
  };
  const nhk = nhkPerType[d.gebaeudetyp] ?? 1280;
  const altersfaktor = Math.max(0.3, 1 - (HEUTE - d.baujahr) * 0.008);
  const w = nhk * d.wohnflaeche * altersfaktor;
  return {
    w1914: Math.round(w / BPI / 12.782),
    w2010: Math.round(w),
    wAktuell: Math.round((w * BPI) / 100) * 100,
    nhk,
    altersfaktor: Math.round(altersfaktor * 100) / 100,
  };
}

export function calcValue(d: BuildingInput, e: EnergyResult): ValueResult {
  const basis = d.baujahr >= 2020 ? 3400 : d.baujahr >= 2000 ? 2500 : d.baujahr >= 1980 ? 2000 : 1500;
  const ci = EC.indexOf(e.klasse);
  const proQm = Math.round(basis * (1.2 - ci * 0.055) * plzPreisIndex(d.plz));
  return { total: Math.round(proQm * d.wohnflaeche), proQm };
}

export function calcRestnutzung(d: BuildingInput, e: EnergyResult, w: WertResult): RestnutzungResult {
  const gnd = ["efh", "dhh", "rh"].includes(d.gebaeudetyp) ? 80 : 60;
  const alter = HEUTE - d.baujahr;
  const rndRegulaer = Math.max(0, gnd - alter);
  const klasse = e.klasse.c;
  const zustandsFaktor =
    klasse === "H" || klasse === "G" ? 0.5
    : klasse === "F" ? 0.65
    : klasse === "E" ? 0.75
    : klasse === "D" ? 0.85
    : 1.0;
  const rndWirtschaftlich = Math.max(5, Math.round(rndRegulaer * zustandsFaktor));
  const afaRegulaer = d.baujahr < 1925 ? 2.5 : 2.0;
  const afaVerkuerzt = rndWirtschaftlich > 0 ? Math.round((100 / rndWirtschaftlich) * 100) / 100 : 0;
  const bemessungsgrundlage = Math.round(w.wAktuell * 0.7);
  const afaRegulaerJahr = Math.round((bemessungsgrundlage * afaRegulaer) / 100);
  const afaVerkuerztJahr = Math.round((bemessungsgrundlage * afaVerkuerzt) / 100);
  const mehrabschreibung = Math.max(0, afaVerkuerztJahr - afaRegulaerJahr);
  const steuerersparnis = Math.round(mehrabschreibung * 0.35);
  return {
    alter,
    gnd,
    rndRegulaer,
    rndWirtschaftlich,
    afaRegulaer,
    afaVerkuerzt,
    afaRegulaerJahr,
    afaVerkuerztJahr,
    bemessungsgrundlage,
    gutachtenLohnt: afaVerkuerzt > afaRegulaer + 0.5,
    mehrabschreibung,
    steuerersparnis,
  };
}

export function calcRisk(d: BuildingInput): RiskResult {
  const cl = plzKlima(d.plz);
  const sturm = cl.t < 9 ? 3 : cl.t < 9.5 ? 2 : 1;
  const hitze = cl.t > 9.5 ? 3 : cl.t > 8.5 ? 2 : 1;
  const baujahrRisiko = d.baujahr < 1960 ? 3 : d.baujahr < 1990 ? 2 : 1;
  const total = Math.round((sturm * 30 + hitze * 25 + baujahrRisiko * 25) / 3);
  const level = total <= 25 ? "Gering" : total <= 50 ? "Mittel" : "Erhöht";
  const color = total <= 25 ? "#4CAF50" : total <= 50 ? "#FFC107" : "#FF9800";
  return { standortRisiko: sturm, hitzeRisiko: hitze, baujahrRisiko, total, level, color };
}

export function calcESG(e: EnergyResult): ESGResult {
  return {
    crrem: e.endenergie <= 55 ? "On Track" : "Off Track",
    euTaxonomie: e.endenergie <= 100,
  };
}

export function calcSolar(d: BuildingInput): SolarResult {
  const dachflaeche = (d.wohnflaeche / Math.max(d.geschosse, 1)) * 0.6;
  const kWp = Math.round(dachflaeche / 7);
  const kWhJahr = kWp * 950;
  return {
    potenzialQm: Math.round(dachflaeche),
    kWp,
    kWhJahr,
    ersparnisEur: Math.round(kWhJahr * 0.12),
  };
}

export function calcRenovation(d: BuildingInput, e: EnergyResult): RenovationSzenario[] {
  const aktKw = e.endenergie;
  const ziele = EC.filter((c) => c.m < aktKw).slice(0, 3);
  return ziele.map((ziel) => {
    const massnahmen: RenovationMassnahme[] = [];
    let rest = aktKw - ziel.m;
    let kosten = 0;
    if (rest > 5 && e.uW > 0.24) {
      const sv = Math.min(rest * 0.3, 55);
      const k = d.wohnflaeche * 155;
      massnahmen.push({ name: "Fassadendämmung", kosten: k, einsparung: sv });
      rest -= sv;
      kosten += k;
    }
    if (rest > 5 && e.uWN > 1.3) {
      const sv = Math.min(rest * 0.18, 28);
      const k = d.wohnflaeche * 90;
      massnahmen.push({ name: "Fenstertausch", kosten: k, einsparung: sv });
      rest -= sv;
      kosten += k;
    }
    if (rest > 5 && (e.klasse.c === "G" || e.klasse.c === "H" || e.klasse.c === "F")) {
      const sv = Math.min(rest * 0.4, 50);
      const k = d.wohnflaeche * 220;
      massnahmen.push({ name: "Heizungstausch (Wärmepumpe)", kosten: k, einsparung: sv });
      rest -= sv;
      kosten += k;
    }
    if (rest > 5) {
      const k = d.wohnflaeche * 80;
      massnahmen.push({ name: "Dachdämmung", kosten: k, einsparung: rest });
      kosten += k;
    }
    return { klasse: ziel.c, massnahmen, gesamtKosten: Math.round(kosten), restEinsparung: Math.max(0, Math.round(rest)) };
  });
}

export const _internals = { HEUTE };
