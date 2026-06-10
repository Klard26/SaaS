import { Building2, Home, KeyRound, Landmark, HardHat, Users, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface KontoTypDef {
  value: string;
  label: string;
  desc: string;
  commercial: boolean;
  icon: LucideIcon;
}

export const KONTO_TYPEN: KontoTypDef[] = [
  { value: "privat", label: "Privatperson", desc: "Eigentümer, Mieter oder Bauherr", commercial: false, icon: Home },
  { value: "hausverwaltung", label: "Hausverwaltung", desc: "WEG- oder Mietverwaltung", commercial: true, icon: Building2 },
  { value: "makler", label: "Immobilienmakler", desc: "Vermittlung von Immobilien", commercial: true, icon: KeyRound },
  { value: "bestandshalter", label: "Bestandshalter / Investor", desc: "Eigener Immobilienbestand", commercial: true, icon: Landmark },
  { value: "bautraeger", label: "Bauträger / Projektentwickler", desc: "Neubau und Projektentwicklung", commercial: true, icon: HardHat },
  { value: "genossenschaft", label: "Wohnungsbaugenossenschaft", desc: "Genossenschaft / Wohnungsgesellschaft", commercial: true, icon: Users },
  { value: "gewerbe", label: "Sonstiges Unternehmen", desc: "Gewerblicher Kunde", commercial: true, icon: Briefcase },
];

export const KONTO_TYP_LABELS: Record<string, string> = Object.fromEntries(
  KONTO_TYPEN.map((k) => [k.value, k.label]),
);

export const KONTO_TYP_VALUES = KONTO_TYPEN.map((k) => k.value);

export function isCommercialTyp(typ: string): boolean {
  return KONTO_TYPEN.find((k) => k.value === typ)?.commercial ?? true;
}
