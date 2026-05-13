export type GebaeudeTyp = "efh" | "dhh" | "rh" | "mfh_s" | "mfh_m" | "mfh_l";

export interface BuildingInput {
  plz: string;
  city?: string;
  baujahr: number;
  wohnflaeche: number;
  geschosse: number;
  wohneinheiten: number;
  gebaeudetyp: GebaeudeTyp;
  heizung: string;
  daemmung: string;
  fenster: string;
  heizungBaujahr?: number;
}

export interface EnergyClass {
  c: string;
  m: number;
  col: string;
}

export interface EnergyResult {
  endenergie: number;
  primaerenergie: number;
  klasse: EnergyClass;
  co2Pro_m2: number;
  co2Tonnen: number;
  qH: number;
  htP: number;
  uW: number;
  uWN: number;
  pflichten: string[];
}

export interface WertResult {
  w1914: number;
  w2010: number;
  wAktuell: number;
  nhk: number;
  altersfaktor: number;
}

export interface ValueResult {
  total: number;
  proQm: number;
}

export interface RestnutzungResult {
  alter: number;
  gnd: number;
  rndRegulaer: number;
  rndWirtschaftlich: number;
  afaRegulaer: number;
  afaVerkuerzt: number;
  afaRegulaerJahr: number;
  afaVerkuerztJahr: number;
  bemessungsgrundlage: number;
  gutachtenLohnt: boolean;
  mehrabschreibung: number;
  steuerersparnis: number;
}

export interface RiskResult {
  standortRisiko: number;
  hitzeRisiko: number;
  baujahrRisiko: number;
  total: number;
  level: "Gering" | "Mittel" | "Erhöht";
  color: string;
}

export interface ESGResult {
  crrem: "On Track" | "Off Track";
  euTaxonomie: boolean;
}

export interface SolarResult {
  potenzialQm: number;
  kWp: number;
  kWhJahr: number;
  ersparnisEur: number;
}

export interface RenovationMassnahme {
  name: string;
  kosten: number;
  einsparung: number;
}

export interface RenovationSzenario {
  klasse: string;
  massnahmen: RenovationMassnahme[];
  gesamtKosten: number;
  restEinsparung: number;
}
