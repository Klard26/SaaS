import type { EnergyClass, GebaeudeTyp } from "./types.ts";

export const PEF: Record<string, { fp: number; co2: number }> = {
  erdgas: { fp: 1.1, co2: 0.24 },
  heizoel: { fp: 1.1, co2: 0.31 },
  strom: { fp: 1.8, co2: 0.56 },
  holz: { fp: 0.2, co2: 0.023 },
  fw: { fp: 0.7, co2: 0.18 },
};

export interface AgeBand {
  ym: number;
  uw: number;
  ur: number;
  uf: number;
  uwi: number;
  d: string;
}

export const AGE: AgeBand[] = [
  { ym: 1918, uw: 1.7, ur: 1.2, uf: 1.0, uwi: 5.0, d: "Gründerzeit" },
  { ym: 1948, uw: 1.5, ur: 1.1, uf: 0.9, uwi: 4.7, d: "1919–48" },
  { ym: 1968, uw: 1.2, ur: 0.9, uf: 0.8, uwi: 3.5, d: "1958–68" },
  { ym: 1978, uw: 1.0, ur: 0.7, uf: 0.7, uwi: 3.1, d: "WSchV 77" },
  { ym: 1994, uw: 0.6, ur: 0.4, uf: 0.5, uwi: 2.1, d: "WSchV 84" },
  { ym: 2008, uw: 0.35, ur: 0.25, uf: 0.35, uwi: 1.5, d: "EnEV 02" },
  { ym: 2015, uw: 0.24, ur: 0.2, uf: 0.3, uwi: 1.3, d: "EnEV 14" },
  { ym: 2099, uw: 0.18, ur: 0.16, uf: 0.25, uwi: 1.0, d: "GEG 24" },
];

export interface Heizung {
  id: string;
  l: string;
  f: keyof typeof PEF;
  e: number;
  ee: number;
  aus?: number;
}

export const HT: Heizung[] = [
  { id: "gas_kt", l: "Gas-Konstanttemperatur", f: "erdgas", e: 0.8, ee: 0, aus: 1 },
  { id: "gas_bw", l: "Gas-Brennwert", f: "erdgas", e: 0.96, ee: 0 },
  { id: "wp_luft", l: "Wärmepumpe Luft", f: "strom", e: 3.5, ee: 100 },
  { id: "wp_sole", l: "Wärmepumpe Sole", f: "strom", e: 4.2, ee: 100 },
  { id: "pellet", l: "Pellet", f: "holz", e: 0.92, ee: 100 },
  { id: "fw", l: "Fernwärme", f: "fw", e: 0.98, ee: 50 },
  { id: "elektro", l: "Nachtspeicher (Strom)", f: "strom", e: 0.98, ee: 0 },
];

export interface DaemmStufe {
  id: string;
  l: string;
  f: number;
}

export const INS: DaemmStufe[] = [
  { id: "none", l: "Keine Dämmung", f: 1.0 },
  { id: "w77", l: "WSchV 77", f: 0.7 },
  { id: "w95", l: "WSchV 95", f: 0.55 },
  { id: "enev", l: "EnEV", f: 0.42 },
  { id: "kfw", l: "KfW 55", f: 0.32 },
  { id: "pass", l: "Passivhaus", f: 0.22 },
];

export interface Fenster {
  id: string;
  l: string;
  u: number;
  g: number;
}

export const WI: Fenster[] = [
  { id: "1f", l: "Einfachverglasung", u: 5.0, g: 0.87 },
  { id: "2f_a", l: "2-fach (alt)", u: 2.8, g: 0.76 },
  { id: "2f", l: "2-fach Wärmeschutz", u: 1.3, g: 0.63 },
  { id: "3f", l: "3-fach", u: 0.7, g: 0.5 },
];

export interface Bautyp {
  id: GebaeudeTyp;
  l: string;
}

export const BT: Bautyp[] = [
  { id: "efh", l: "Einfamilienhaus" },
  { id: "dhh", l: "Doppelhaushälfte" },
  { id: "rh", l: "Reihenhaus" },
  { id: "mfh_s", l: "MFH 3–6 Wohneinheiten" },
  { id: "mfh_m", l: "MFH 7–12 Wohneinheiten" },
  { id: "mfh_l", l: "MFH > 12 Wohneinheiten" },
];

export const EC: EnergyClass[] = [
  { c: "A+", m: 30, col: "#00843D" },
  { c: "A", m: 50, col: "#4CAF50" },
  { c: "B", m: 75, col: "#8BC34A" },
  { c: "C", m: 100, col: "#CDDC39" },
  { c: "D", m: 130, col: "#FFEB3B" },
  { c: "E", m: 160, col: "#FFC107" },
  { c: "F", m: 200, col: "#FF9800" },
  { c: "G", m: 250, col: "#FF5722" },
  { c: "H", m: 9999, col: "#D32F2F" },
];

export const CL: Record<number, { d: number; t: number; l: string }> = {
  0: { d: 230, t: 8.5, l: "Ostdeutschland" },
  1: { d: 228, t: 8.6, l: "Berlin/Brandenburg" },
  2: { d: 225, t: 9.0, l: "Hamburg/Norddeutschland" },
  3: { d: 228, t: 8.8, l: "Mitteldeutschland" },
  4: { d: 222, t: 9.2, l: "Nordrhein-Westfalen" },
  5: { d: 218, t: 9.8, l: "Rhein-Main" },
  6: { d: 215, t: 10.0, l: "Südwestdeutschland" },
  7: { d: 225, t: 9.0, l: "Baden-Württemberg" },
  8: { d: 235, t: 8.2, l: "Bayern" },
  9: { d: 232, t: 8.4, l: "Franken" },
};

export interface SspSzenario {
  id: string;
  l: string;
  t30: number;
  t50: number;
  t80: number;
  col: string;
}

export const SSP: SspSzenario[] = [
  { id: "ssp126", l: "SSP1-2.6 (Optimistisch)", t30: 1.2, t50: 1.5, t80: 1.6, col: "#4CAF50" },
  { id: "ssp245", l: "SSP2-4.5 (Moderat)", t30: 1.3, t50: 1.8, t80: 2.4, col: "#FFC107" },
  { id: "ssp585", l: "SSP5-8.5 (Pessimistisch)", t30: 1.4, t50: 2.3, t80: 4.2, col: "#D32F2F" },
];

export const BPI = 1.487;

const PI: Record<number, number> = { 10: 1.35, 20: 1.42, 80: 1.88, 50: 1.22, 60: 1.48, 70: 1.38, 40: 1.32 };

export function plzPraefix(plz: string): number | null {
  if (!plz || plz.length < 2) return null;
  const n = Number.parseInt(plz.substring(0, 2), 10);
  return Number.isFinite(n) ? n : null;
}

export function plzPreisIndex(plz: string): number {
  const n = plzPraefix(plz);
  return n === null ? 1 : PI[n] ?? 1;
}

export function plzKlima(plz: string): { d: number; t: number; l: string } {
  const n = plzPraefix(plz);
  const key = n === null ? 6 : Number.parseInt(String(n)[0], 10);
  return CL[key] ?? CL[6];
}

export function plzBundesland(plz: string): string {
  const n = plzPraefix(plz);
  if (n === null) return "";
  if (n >= 10 && n <= 12) return "Berlin";
  if (n >= 14 && n <= 16) return "Brandenburg";
  if (n >= 17 && n <= 19) return "Mecklenburg-Vorpommern";
  if (n >= 20 && n <= 21) return "Hamburg";
  if (n >= 22 && n <= 27) return "Schleswig-Holstein";
  if (n >= 28 && n <= 29) return "Niedersachsen";
  if (n >= 30 && n <= 38) return "Niedersachsen";
  if (n >= 39 && n <= 39) return "Sachsen-Anhalt";
  if (n >= 40 && n <= 59) return "Nordrhein-Westfalen";
  if (n >= 60 && n <= 65) return "Hessen";
  if (n >= 66 && n <= 67) return "Rheinland-Pfalz/Saarland";
  if (n >= 68 && n <= 69) return "Baden-Württemberg";
  if (n >= 70 && n <= 79) return "Baden-Württemberg";
  if (n >= 80 && n <= 87) return "Bayern";
  if (n >= 88 && n <= 89) return "Baden-Württemberg";
  if (n >= 90 && n <= 96) return "Bayern";
  if (n >= 97 && n <= 97) return "Unterfranken";
  if (n >= 98 && n <= 99) return "Thüringen";
  return "";
}

export function ageBand(baujahr: number): AgeBand {
  return AGE.find((a) => baujahr <= a.ym) ?? AGE[AGE.length - 1]!;
}
