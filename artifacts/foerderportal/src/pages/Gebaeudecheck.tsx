import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnergyBar } from "@/components/EnergieSchnellcheck";
import { ReportPreviewDemo } from "@/components/ReportPreviewDemo";
import { AddressAutocomplete, type AddressResult } from "@/components/AddressAutocomplete";
import { StandortMap } from "@/components/StandortMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Lock, ShieldCheck, Mail, FileDown,
  MapPin, UserRound,
} from "lucide-react";
import {
  AGE, BT, HT, INS, WI, ZUSTAND, ageBand,
  calcEnergie, type BuildingInput,
} from "@workspace/energie-calc";
import { useCreateReportCheckout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  matchProgramme,
  ART_LABEL,
  EBENE_LABEL,
  STATUS_LABEL,
  type MatchProfil,
  type Programm,
} from "@/lib/foerderpilotApi";

const REPORT_PRICE_LABEL = "49 €";
const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT: BuildingInput = {
  plz: "",
  city: "",
  strasse: "",
  hausnummer: "",
  baujahr: 1985,
  wohnflaeche: 140,
  geschosse: 2,
  wohneinheiten: 1,
  gebaeudetyp: "efh",
  heizung: "gas_kt",
  daemmung: "none",
  fenster: "2f_a",
  heizungBaujahr: 2005,
  zustand: "unsaniert",
};

/** Representative Wohneinheiten / Geschosse per building type (no manual entry). */
const TYP_UNITS: Record<string, { wohneinheiten: number; geschosse: number }> = {
  efh: { wohneinheiten: 1, geschosse: 2 },
  dhh: { wohneinheiten: 1, geschosse: 2 },
  rh: { wohneinheiten: 1, geschosse: 2 },
  mfh_s: { wohneinheiten: 4, geschosse: 3 },
  mfh_m: { wohneinheiten: 9, geschosse: 4 },
  mfh_l: { wohneinheiten: 16, geschosse: 5 },
};

/**
 * Map a building type to a funding-catalog zielgruppe slug. Residential building
 * owners (single- and multi-family) fall under the catalog's "Privatpersonen /
 * Eigentümer" group, which carries the building-renovation programs.
 */
const TYP_ZIELGRUPPE: Record<string, string> = {
  efh: "privat",
  dhh: "privat",
  rh: "privat",
  mfh_s: "privat",
  mfh_m: "privat",
  mfh_l: "privat",
};

/** Build the funding-catalog match profile from the Gebäudecheck answers. */
function gebaeudeToMatchProfil(d: BuildingInput): MatchProfil {
  return {
    kategorien: ["energie_gebaeude"],
    zielgruppe: TYP_ZIELGRUPPE[d.gebaeudetyp] ?? "privat",
    limit: 6,
  };
}

type Kontakt = {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  anschrift: string;
};

type Opt = {
  id: string;
  label: string;
  hint?: string;
  patch: Partial<BuildingInput>;
};

type StepDef = {
  key: string;
  title: string;
  subtitle: string;
  options: Opt[];
  /** Returns the option id currently reflected by the building profile (for highlight). */
  selectedId: (d: BuildingInput) => string;
};

// Baujahr bands → a representative mid-year per band (kept inside the band).
const BAUJAHR_OPTS: Opt[] = AGE.map((band, i) => {
  const lower = i === 0 ? 1880 : (AGE[i - 1]!.ym + 1);
  const upperEff = Math.min(band.ym, CURRENT_YEAR);
  const rep = Math.round((lower + upperEff) / 2);
  return { id: String(band.ym), label: band.d, patch: { baujahr: rep } };
});

const WOHNFLAECHE_OPTS: Opt[] = [
  { id: "s", label: "Bis 80 m²", patch: { wohnflaeche: 70 } },
  { id: "m", label: "80 – 120 m²", patch: { wohnflaeche: 100 } },
  { id: "l", label: "120 – 160 m²", patch: { wohnflaeche: 140 } },
  { id: "xl", label: "160 – 220 m²", patch: { wohnflaeche: 190 } },
  { id: "xxl", label: "Über 220 m²", patch: { wohnflaeche: 260 } },
];

const HEIZUNGSALTER_OPTS: Opt[] = [
  { id: "neu", label: "Neuer als 5 Jahre", patch: { heizungBaujahr: CURRENT_YEAR - 3 } },
  { id: "mittel", label: "5 – 15 Jahre", patch: { heizungBaujahr: CURRENT_YEAR - 10 } },
  { id: "alt", label: "15 – 25 Jahre", patch: { heizungBaujahr: CURRENT_YEAR - 20 } },
  { id: "sehralt", label: "Älter als 25 Jahre", patch: { heizungBaujahr: CURRENT_YEAR - 30 } },
];

function wohnflaecheSelectedId(d: BuildingInput): string {
  const w = d.wohnflaeche;
  if (w <= 80) return "s";
  if (w <= 120) return "m";
  if (w <= 160) return "l";
  if (w <= 220) return "xl";
  return "xxl";
}

function heizungsalterSelectedId(d: BuildingInput): string {
  const age = CURRENT_YEAR - (d.heizungBaujahr ?? CURRENT_YEAR);
  if (age < 5) return "neu";
  if (age < 15) return "mittel";
  if (age < 25) return "alt";
  return "sehralt";
}

const STEPS: StepDef[] = [
  {
    key: "gebaeudetyp",
    title: "Um welches Gebäude geht es?",
    subtitle: "Wählen Sie den Gebäudetyp, der am besten passt.",
    options: BT.map((b) => ({
      id: b.id,
      label: b.l,
      patch: { gebaeudetyp: b.id, ...(TYP_UNITS[b.id] ?? {}) },
    })),
    selectedId: (d) => d.gebaeudetyp,
  },
  {
    key: "baujahr",
    title: "Aus welcher Bauzeit stammt das Gebäude?",
    subtitle: "Eine grobe Einordnung genügt — das reicht für den Schnellcheck.",
    options: BAUJAHR_OPTS,
    selectedId: (d) => String(ageBand(d.baujahr).ym),
  },
  {
    key: "wohnflaeche",
    title: "Wie groß ist die beheizte Wohnfläche?",
    subtitle: "Schätzen Sie die Größenklasse — eine genaue Zahl ist nicht nötig.",
    options: WOHNFLAECHE_OPTS,
    selectedId: wohnflaecheSelectedId,
  },
  {
    key: "heizung",
    title: "Womit wird geheizt?",
    subtitle: "Wählen Sie die aktuelle Heizungsart.",
    options: HT.map((h) => ({ id: h.id, label: h.l, patch: { heizung: h.id } })),
    selectedId: (d) => d.heizung,
  },
  {
    key: "heizungsalter",
    title: "Wie alt ist die Heizung ungefähr?",
    subtitle: "Das Alter beeinflusst Effizienz und mögliche Förderungen.",
    options: HEIZUNGSALTER_OPTS,
    selectedId: heizungsalterSelectedId,
  },
  {
    key: "daemmung",
    title: "Wie ist der Dämmstandard?",
    subtitle: "Wählen Sie die Dämmung, die dem Gebäude am nächsten kommt.",
    options: INS.map((i) => ({ id: i.id, label: i.l, patch: { daemmung: i.id } })),
    selectedId: (d) => d.daemmung,
  },
  {
    key: "fenster",
    title: "Welche Fenster sind verbaut?",
    subtitle: "Die Verglasung wirkt sich stark auf den Wärmeverlust aus.",
    options: WI.map((w) => ({ id: w.id, label: w.l, patch: { fenster: w.id } })),
    selectedId: (d) => d.fenster,
  },
  {
    key: "zustand",
    title: "Wie ist der energetische Gesamtzustand?",
    subtitle: "Letzter Schritt — danach sehen Sie Ihr Ergebnis.",
    options: ZUSTAND.map((z) => ({
      id: z.id,
      label: z.l,
      patch: { zustand: z.id as BuildingInput["zustand"] },
    })),
    selectedId: (d) => d.zustand ?? "unsaniert",
  },
];

export default function Gebaeudecheck() {
  const { toast } = useToast();
  const checkout = useCreateReportCheckout();
  const [d, setD] = useState<BuildingInput>(DEFAULT);
  const [adresse, setAdresse] = useState("");
  // Optional Personalien (for registration / report assignment) — never required.
  const [kontakt, setKontakt] = useState<Kontakt>({
    vorname: "", nachname: "", email: "", telefon: "", anschrift: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Förder-Affiliate: SEPARATE, opt-in financing-offer consent (never pre-checked).
  const [financeConsent, setFinanceConsent] = useState(false);
  // Synchronous mirror of the last selected address label, so editing the text
  // after a selection reliably clears the (now stale) selection.
  const selectedLabelRef = useRef("");
  // step 0 = Standort (Adresse + Karte), steps 1..STEPS.length = Optionsschritte.
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);

  const total = STEPS.length + 1;
  const onResult = step > STEPS.length;
  const onStandort = step === 0;
  const progress = onResult ? 100 : Math.round((step / total) * 100);

  const energie = useMemo(() => (onResult ? calcEnergie(d) : null), [d, onResult]);

  function pick(opt: Opt) {
    setD((p) => ({ ...p, ...opt.patch }));
    setStep((s) => s + 1);
  }

  function onAddressSelect(r: AddressResult) {
    selectedLabelRef.current = r.label;
    setD((p) => ({
      ...p,
      plz: r.plz ?? "",
      city: r.city ?? "",
      strasse: r.strasse ?? "",
      hausnummer: r.hausnummer ?? "",
    }));
    setCoords({ lat: r.lat, lng: r.lng });
  }

  function onAddressChange(text: string) {
    setAdresse(text);
    // If the user edits the text after picking a suggestion, the selection is no
    // longer valid — drop it so "Weiter" stays gated until they re-select.
    if (text !== selectedLabelRef.current && (coords !== null || d.plz !== "")) {
      selectedLabelRef.current = "";
      setCoords(null);
      setD((p) => ({ ...p, plz: "", city: "", strasse: "", hausnummer: "" }));
    }
  }

  function buildAdresseString(): string | null {
    const street = [d.strasse, d.hausnummer].filter(Boolean).join(" ");
    const city = [d.plz, d.city].filter(Boolean).join(" ");
    const full = [street, city].filter(Boolean).join(", ");
    return full.length > 0 ? full : adresse.trim() || null;
  }

  async function handleBuy() {
    setPending(true);
    try {
      const k = {
        vorname: kontakt.vorname.trim(),
        nachname: kontakt.nachname.trim(),
        email: kontakt.email.trim(),
        telefon: kontakt.telefon.trim(),
        anschrift: kontakt.anschrift.trim(),
      };
      // Only attach kontakt when the buyer actually entered personal data —
      // the auto-derived building address must NOT make the optional form "filled".
      const hasKontakt = Object.values(k).some((v) => v.length > 0);
      const res = await checkout.mutateAsync({
        data: {
          adresse: buildAdresseString(),
          profil: d as unknown as Record<string, unknown>,
          ...(hasKontakt
            ? { kontakt: { ...k, anschrift: k.anschrift || buildAdresseString() || "" } }
            : {}),
          ...(financeConsent ? { financeConsent: true } : {}),
        },
      });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        throw new Error("Keine Checkout-URL erhalten.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast({
        title: "Checkout fehlgeschlagen",
        description: msg.includes("503")
          ? "Zahlungen sind derzeit nicht konfiguriert."
          : msg || "Bitte später erneut versuchen.",
        variant: "destructive",
      });
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="bg-[var(--klard-bg)] py-8 sm:py-12 px-4 sm:px-8 border-b border-border">
        <div className="max-w-[860px] mx-auto">
          <span className="inline-block bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)] text-[0.7rem] font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-3">
            Gebäudecheck
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Energieklasse Ihrer Immobilie — in unter einer Minute
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Geben Sie die Anschrift des Gebäudes ein und beantworten Sie ein paar
            einfache Fragen per Klick — keine Anmeldung. Am Ende sehen Sie Ihre
            Energieklasse kostenlos. Den ausführlichen Gebäudereport als PDF erhalten
            Sie anschließend ganz ohne Konto.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-8 max-w-[860px] mx-auto w-full flex-1">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
            <span>
              {onResult ? "Ergebnis" : `Schritt ${step + 1} von ${total}`}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--klard-teal-l)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--klard-teal)] transition-all duration-300"
              style={{ width: `${Math.max(progress, 6)}%` }}
            />
          </div>
        </div>

        {onResult ? (
          <ResultView
            d={d}
            energie={energie!}
            pending={pending}
            kontakt={kontakt}
            onKontaktChange={(patch) => setKontakt((p) => ({ ...p, ...patch }))}
            adressePlaceholder={buildAdresseString() ?? ""}
            financeConsent={financeConsent}
            onFinanceConsentChange={setFinanceConsent}
            onBuy={handleBuy}
            onBack={() => setStep(STEPS.length)}
          />
        ) : onStandort ? (
          <StandortView
            value={adresse}
            coords={coords}
            selected={d.plz !== "" || coords !== null}
            label={[d.strasse, d.hausnummer].filter(Boolean).join(" ")}
            city={[d.plz, d.city].filter(Boolean).join(" ")}
            onChange={onAddressChange}
            onSelect={onAddressSelect}
            onNext={() => setStep(1)}
          />
        ) : (
          <StepView
            step={STEPS[step - 1]!}
            current={STEPS[step - 1]!.selectedId(d)}
            canGoBack={step > 0}
            onBack={() => setStep((s) => Math.max(0, s - 1))}
            onPick={pick}
          />
        )}
      </section>

      <Footer />
    </div>
  );
}

function StandortView({
  value, coords, selected, label, city, onChange, onSelect, onNext,
}: {
  value: string;
  coords: { lat: number; lng: number } | null;
  selected: boolean;
  label: string;
  city: string;
  onChange: (text: string) => void;
  onSelect: (r: AddressResult) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
        Wo steht das Gebäude?
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Geben Sie die Anschrift ein und wählen Sie den passenden Vorschlag. Der
        Standort fließt über die Klimazone (Heizgradtage) in die Energieberechnung ein.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Anschrift des Gebäudes
          </label>
          <AddressAutocomplete
            value={value}
            onChange={onChange}
            onSelect={onSelect}
            placeholder="Straße und Hausnummer eingeben…"
            testId="input-adresse"
          />
        </div>

        {coords && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-[var(--klard-teal-d)] shrink-0" />
              <span className="font-medium">
                {[label, city].filter(Boolean).join(", ") || "Standort ausgewählt"}
              </span>
            </div>
            <StandortMap
              lat={coords.lat}
              lng={coords.lng}
              label={[label, city].filter(Boolean).join(", ") || undefined}
              className="h-[280px] w-full rounded-lg border border-border"
            />
            <p className="text-xs text-muted-foreground">
              Standortanalyse über unsere eigene Karten-API — datenschonend und
              unabhängig von externen Diensten.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selected
            ? "Adresse erkannt — weiter zu den Gebäudefragen"
            : "Bitte wählen Sie eine Adresse aus der Vorschlagsliste"}
        </span>
        <Button
          onClick={onNext}
          disabled={!selected}
          data-testid="button-standort-next"
          className="bg-[var(--klard-teal)] hover:bg-[var(--klard-teal-d)] text-white"
        >
          Weiter
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

function StepView({
  step, current, canGoBack, onBack, onPick,
}: {
  step: StepDef;
  current: string;
  canGoBack: boolean;
  onBack: () => void;
  onPick: (o: Opt) => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
        {step.title}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">{step.subtitle}</p>

      <div className="grid sm:grid-cols-2 gap-3">
        {step.options.map((o) => {
          const active = o.id === current;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o)}
              data-testid={`option-${step.key}-${o.id}`}
              className={`group flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all hover:border-[var(--klard-teal)] hover:shadow-sm ${
                active
                  ? "border-[var(--klard-teal)] bg-[var(--klard-teal-p)] ring-1 ring-[var(--klard-teal)]"
                  : "border-border bg-card"
              }`}
            >
              <span className="text-sm font-medium text-foreground leading-snug">
                {o.label}
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  active
                    ? "border-[var(--klard-teal)] bg-[var(--klard-teal)] text-white"
                    : "border-border text-transparent group-hover:border-[var(--klard-teal)]"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={!canGoBack}
          data-testid="button-step-back"
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Zurück
        </Button>
        <span className="text-xs text-muted-foreground">
          Tippen Sie eine Option an, um fortzufahren
        </span>
      </div>
    </div>
  );
}

function ResultView({
  d, energie, pending, kontakt, onKontaktChange, adressePlaceholder,
  financeConsent, onFinanceConsentChange, onBuy, onBack,
}: {
  d: BuildingInput;
  energie: ReturnType<typeof calcEnergie>;
  pending: boolean;
  kontakt: Kontakt;
  onKontaktChange: (patch: Partial<Kontakt>) => void;
  adressePlaceholder: string;
  financeConsent: boolean;
  onFinanceConsentChange: (v: boolean) => void;
  onBuy: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Free result */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
          Ihr kostenloser Schnellcheck
        </div>
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                Geschätzte Energieklasse
              </h2>
              <Badge
                style={{ background: energie.klasse.col, color: "#fff" }}
                className="text-base px-3 py-1"
                data-testid="badge-energieklasse"
              >
                {energie.klasse.c}
              </Badge>
            </div>
            <EnergyBar value={energie.endenergie} />
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Endenergie" value={`${energie.endenergie}`} unit="kWh/(m²·a)" />
              <Stat label="Primärenergie" value={`${energie.primaerenergie}`} unit="kWh/(m²·a)" />
              <Stat label="CO₂" value={`${energie.co2Tonnen} t`} unit="pro Jahr" />
            </div>
            <div className="flex justify-start">
              <Button
                variant="ghost"
                onClick={onBack}
                data-testid="button-result-back"
                className="text-muted-foreground px-0 hover:bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Auswahl ändern
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized funding shortlist — fed from the building profile */}
      <FoerderMatch d={d} />

      {/* Optional Personalien — for registration / report assignment */}
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[var(--klard-teal-d)]" />
              <h3 className="font-serif text-lg font-semibold text-foreground">
                Persönliche Daten <span className="text-muted-foreground font-normal text-sm">(optional)</span>
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Möchten Sie sich registrieren und Ihren Report Ihrem Konto zuordnen?
              Hinterlassen Sie optional Ihre Personalien. Sie können den Report auch
              ganz ohne Angabe als Gast kaufen.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Vorname"
              value={kontakt.vorname}
              onChange={(v) => onKontaktChange({ vorname: v })}
              placeholder="Max"
              testId="input-kontakt-vorname"
            />
            <Field
              label="Nachname"
              value={kontakt.nachname}
              onChange={(v) => onKontaktChange({ nachname: v })}
              placeholder="Mustermann"
              testId="input-kontakt-nachname"
            />
            <Field
              label="E-Mail"
              type="email"
              value={kontakt.email}
              onChange={(v) => onKontaktChange({ email: v })}
              placeholder="max@beispiel.de"
              testId="input-kontakt-email"
            />
            <Field
              label="Telefonnummer"
              type="tel"
              value={kontakt.telefon}
              onChange={(v) => onKontaktChange({ telefon: v })}
              placeholder="0151 23456789"
              testId="input-kontakt-telefon"
            />
            <div className="sm:col-span-2">
              <Field
                label="Anschrift"
                value={kontakt.anschrift}
                onChange={(v) => onKontaktChange({ anschrift: v })}
                placeholder={adressePlaceholder || "Straße, Hausnummer, PLZ Ort"}
                testId="input-kontakt-anschrift"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ihre Angaben sind freiwillig und dienen ausschließlich der Zuordnung und
            optionalen Registrierung. Die Zahlung selbst erfolgt sicher im Checkout.
          </p>
        </CardContent>
      </Card>

      {/* Guest express checkout — placed ABOVE the preview */}
      <Card className="bg-[var(--klard-teal-p)] border-[var(--klard-teal-l)]">
        <CardContent className="py-6 px-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[var(--klard-teal-d)]" />
            <div className="text-xs uppercase tracking-wide text-[var(--klard-teal-d)] font-semibold">
              Ausführlicher Gebäudereport ({REPORT_PRICE_LABEL})
            </div>
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Detaillierten Gebäudereport als PDF freischalten
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enthält passende Förderprogramme mit geschätzter Förderhöhe, empfohlene
            Maßnahmen mit Kostenspannen und Energieeinsparung sowie den vollständigen
            Energiebericht. Einmalig {REPORT_PRICE_LABEL} pro Objekt.
          </p>

          <ul className="space-y-1.5 text-sm text-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--klard-teal-d)] shrink-0" />
              Express-Checkout ohne Konto — schnell und sicher bezahlen
            </li>
            <li className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-[var(--klard-teal-d)] shrink-0" />
              PDF direkt nach der Zahlung ansehen und speichern
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[var(--klard-teal-d)] shrink-0" />
              Zusätzlich erhalten Sie den Report-Link per E-Mail
            </li>
          </ul>

          <label
            className="flex items-start gap-3 rounded-lg border border-[var(--klard-teal-l)] bg-card/70 p-3 cursor-pointer"
            data-testid="label-finance-consent"
          >
            <input
              type="checkbox"
              checked={financeConsent}
              onChange={(e) => onFinanceConsentChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--klard-teal)]"
              data-testid="checkbox-finance-consent"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Optional:</span> Ich
              möchte unverbindliche Finanzierungsangebote passender Partner
              (Banken, Modernisierungs- und Sanierungskredite) erhalten und
              willige ein, dass meine Kontakt- und Gebäudedaten zu diesem Zweck
              weitergegeben werden. Freiwillig und jederzeit mit Wirkung für die
              Zukunft widerrufbar.
            </span>
          </label>

          <Button
            className="w-full bg-[var(--klard-teal)] hover:bg-[var(--klard-teal-d)] text-white font-semibold h-11"
            disabled={pending}
            onClick={onBuy}
            data-testid="button-buy-report"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Jetzt als PDF kaufen ({REPORT_PRICE_LABEL})
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Ihre E-Mail-Adresse geben Sie sicher im Checkout ein. Es wird kein Konto angelegt.
          </p>
        </CardContent>
      </Card>

      {/* Report preview teaser — placed BELOW the buy button */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
          So kann Ihr Gebäudereport aussehen
        </div>
        <div className="rounded-xl border border-border bg-[var(--klard-bg)]/40 p-4 sm:p-8">
          <ReportPreviewDemo />
          <p className="mx-auto mt-5 max-w-xl text-center text-sm text-muted-foreground leading-relaxed">
            Energiebilanz, passende Förderprogramme, geschätzte Förderhöhe und ein
            konkreter Sanierungsfahrplan mit Kosten — kompakt auf einen Blick und als
            PDF speicherbar.
          </p>
        </div>
      </div>
    </div>
  );
}

function FoerderMatch({ d }: { d: BuildingInput }) {
  const [treffer, setTreffer] = useState<Programm[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    matchProgramme(gebaeudeToMatchProfil(d))
      .then((res) => {
        if (active) setTreffer(res.treffer);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setTreffer([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Re-run whenever the building profile relevant to matching changes.
  }, [d.gebaeudetyp]);

  if (error) return null;

  return (
    <div data-testid="section-foerder-match">
      <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
        Passende Förderprogramme für Ihr Gebäude
      </div>
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Auf Basis Ihrer Angaben haben wir passende Förderprogramme aus unserer
            Datenbank zusammengestellt. Tippen Sie ein Programm an für alle Details.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Passende Programme werden geladen…
            </div>
          ) : treffer && treffer.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                {treffer.map((p) => (
                  <MatchCard key={p.id} programm={p} />
                ))}
              </div>
              <div className="pt-1">
                <Link href="/foerderung">
                  <Button
                    variant="link"
                    className="text-[var(--klard-teal-d)] px-0"
                    data-testid="link-alle-programme"
                  >
                    Alle Förderprogramme durchsuchen
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-3">
                Aktuell konnten wir keine direkt passenden Programme zuordnen.
                Durchsuchen Sie die gesamte Förderdatenbank.
              </p>
              <Link href="/foerderung">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="link-alle-programme"
                >
                  Förderdatenbank öffnen
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchCard({ programm: p }: { programm: Programm }) {
  return (
    <Link href={`/foerderung/${p.id}`}>
      <div
        className="flex flex-col h-full gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-[var(--klard-teal)] hover:shadow-sm cursor-pointer"
        data-testid={`match-${p.id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-snug text-foreground">{p.titel}</h4>
          <Badge variant="secondary" className="shrink-0 text-[0.65rem]">
            {EBENE_LABEL[p.ebene]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex w-fit items-center rounded-full bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)] text-xs font-semibold px-2.5 py-0.5">
            {ART_LABEL[p.art]}
          </span>
          {p.status === "verifiziert" && (
            <span className="inline-flex w-fit items-center rounded-full bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5">
              {STATUS_LABEL[p.status]}
            </span>
          )}
        </div>
        {p.foerderquote_text && (
          <p className="text-xs font-medium text-foreground">{p.foerderquote_text}</p>
        )}
        {p.kurzbeschreibung && (
          <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-3">
            {p.kurzbeschreibung}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[0.7rem] text-muted-foreground">{p.foerdergeber}</span>
          <ArrowRight className="h-4 w-4 text-[var(--klard-teal)]" />
        </div>
      </div>
    </Link>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  testId?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--klard-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--klard-teal)]"
      />
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 border border-border p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
      <div className="font-serif text-lg font-semibold text-foreground leading-tight">{value}</div>
      {unit && <div className="text-[10px] text-muted-foreground">{unit}</div>}
    </div>
  );
}
