import { useMemo, useState } from "react";
import { Show } from "@clerk/react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnergieSchnellcheck, EnergyBar } from "@/components/EnergieSchnellcheck";
import { ReportPreviewDemo } from "@/components/ReportPreviewDemo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import {
  BT, HT, INS, WI, ZUSTAND, ageBand,
  calcEnergie, type BuildingInput,
} from "@workspace/energie-calc";
import { useCreateReportCheckout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const REPORT_PRICE_LABEL = "49 €";

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

export default function Gebaeudecheck() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="bg-[var(--klard-bg)] py-8 sm:py-12 px-4 sm:px-8 border-b border-border">
        <div className="max-w-[1280px] mx-auto">
          <span className="inline-block bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)] text-[0.7rem] font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-3">
            Gebäudecheck
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Energieklasse, Förderung und Sanierungskosten Ihrer Immobilie
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Der Schnellcheck mit Energieklasse ist kostenlos. Den ausführlichen Gebäudereport
            mit passenden Förderprogrammen, geschätzter Förderhöhe und Sanierungskosten kaufen
            Sie als PDF pro Objekt.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-8 max-w-[1280px] mx-auto w-full flex-1 space-y-8">
        {/* Free quick check */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            Kostenloser Schnellcheck
          </div>
          <EnergieSchnellcheck variant="card" showCta={false} />
        </div>

        {/* Report preview / demo */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            So sieht Ihr ausführlicher Report aus
          </div>
          <div className="rounded-xl border border-border bg-[var(--klard-bg)]/40 p-4 sm:p-8">
            <ReportPreviewDemo />
            <p className="mx-auto mt-5 max-w-xl text-center text-sm text-muted-foreground leading-relaxed">
              Energiebilanz, passende Förderprogramme, geschätzte Förderhöhe und ein konkreter
              Sanierungsfahrplan mit Kosten — kompakt auf einen Blick und als PDF speicherbar.
            </p>
          </div>
        </div>

        {/* Detailed report */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Ausführlicher Gebäudereport ({REPORT_PRICE_LABEL})
            </div>
          </div>
          <Show when="signed-in">
            <SignedInReportForm />
          </Show>
          <Show when="signed-out">
            <AnonGate />
          </Show>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function AnonGate() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 px-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Für den ausführlichen Report anmelden</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Mit einem kostenlosen Konto erfassen Sie Ihr Gebäudeprofil, kaufen den
            detaillierten Gebäudereport als PDF und sehen passende Förderprogramme.
          </p>
        </div>
        <Link href="/sign-up">
          <Button
            className="bg-[var(--klard-teal)] hover:bg-[var(--klard-teal-d)] text-white"
            data-testid="button-signup-cta"
          >
            Kostenlos registrieren
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function SignedInReportForm() {
  const { toast } = useToast();
  const checkout = useCreateReportCheckout();
  const [d, setD] = useState<BuildingInput>(DEFAULT);
  const [pending, setPending] = useState(false);

  const u = <K extends keyof BuildingInput>(k: K, v: BuildingInput[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  const valid = d.plz.length >= 5 && d.baujahr >= 1850 && d.wohnflaeche >= 20;
  const energie = useMemo(() => (valid ? calcEnergie(d) : null), [d, valid]);

  const adresse = [
    [d.strasse, d.hausnummer].filter(Boolean).join(" "),
    [d.plz, d.city].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");

  async function handleBuy() {
    if (!valid) return;
    setPending(true);
    try {
      const res = await checkout.mutateAsync({
        data: {
          adresse: adresse || null,
          profil: d as unknown as Record<string, unknown>,
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
    <div className="grid lg:grid-cols-[380px_1fr] gap-6">
      {/* INPUTS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gebäudedaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Straße">
              <Input
                value={d.strasse ?? ""}
                onChange={(e) => u("strasse", e.target.value)}
                placeholder="Hauptstraße"
                data-testid="input-strasse"
              />
            </Field>
            <Field label="Hausnummer">
              <Input
                value={d.hausnummer ?? ""}
                onChange={(e) => u("hausnummer", e.target.value)}
                placeholder="12"
                data-testid="input-hausnummer"
              />
            </Field>
            <Field label="PLZ">
              <Input
                value={d.plz}
                onChange={(e) => u("plz", e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="10115"
                inputMode="numeric"
                maxLength={5}
                data-testid="input-plz"
              />
            </Field>
            <Field label="Stadt">
              <Input
                value={d.city ?? ""}
                onChange={(e) => u("city", e.target.value)}
                placeholder="Berlin"
                data-testid="input-city"
              />
            </Field>
            <Field label="Baujahr" hint={ageBand(d.baujahr).d}>
              <Input
                type="number"
                value={d.baujahr}
                onChange={(e) => u("baujahr", Number(e.target.value) || 0)}
                min={1850}
                max={new Date().getFullYear()}
                data-testid="input-baujahr"
              />
            </Field>
            <Field label="Wohnfläche (m²)">
              <Input
                type="number"
                value={d.wohnflaeche}
                onChange={(e) => u("wohnflaeche", Number(e.target.value) || 0)}
                min={20}
                data-testid="input-wohnflaeche"
              />
            </Field>
            <Field label="Geschosse">
              <Input
                type="number"
                value={d.geschosse}
                onChange={(e) => u("geschosse", Math.max(1, Number(e.target.value) || 1))}
                min={1}
                max={20}
                data-testid="input-geschosse"
              />
            </Field>
            <Field label="Wohneinheiten">
              <Input
                type="number"
                value={d.wohneinheiten}
                onChange={(e) => u("wohneinheiten", Math.max(1, Number(e.target.value) || 1))}
                min={1}
                data-testid="input-wohneinheiten"
              />
            </Field>
          </div>

          <Field label="Gebäudetyp">
            <SelectField
              value={d.gebaeudetyp}
              options={BT.map((b) => ({ value: b.id, label: b.l }))}
              onChange={(v) => u("gebaeudetyp", v as BuildingInput["gebaeudetyp"])}
              testId="select-gebaeudetyp"
            />
          </Field>
          <Field label="Heizung">
            <SelectField
              value={d.heizung}
              options={HT.map((h) => ({ value: h.id, label: h.l }))}
              onChange={(v) => u("heizung", v)}
              testId="select-heizung"
            />
          </Field>
          <Field label="Heizung Baujahr">
            <Input
              type="number"
              value={d.heizungBaujahr ?? ""}
              onChange={(e) => u("heizungBaujahr", Number(e.target.value) || undefined)}
              min={1950}
              max={new Date().getFullYear()}
              data-testid="input-heizung-baujahr"
            />
          </Field>
          <Field label="Dämmung">
            <SelectField
              value={d.daemmung}
              options={INS.map((i) => ({ value: i.id, label: i.l }))}
              onChange={(v) => u("daemmung", v)}
              testId="select-daemmung"
            />
          </Field>
          <Field label="Fenster">
            <SelectField
              value={d.fenster}
              options={WI.map((w) => ({ value: w.id, label: w.l }))}
              onChange={(v) => u("fenster", v)}
              testId="select-fenster"
            />
          </Field>
          <Field label="Energetischer Zustand">
            <SelectField
              value={d.zustand ?? "unsaniert"}
              options={ZUSTAND.map((z) => ({ value: z.id, label: z.l }))}
              onChange={(v) => u("zustand", v as BuildingInput["zustand"])}
              testId="select-zustand"
            />
          </Field>
        </CardContent>
      </Card>

      {/* PREVIEW + BUY */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Vorschau Energieklasse</span>
              {energie && (
                <Badge style={{ background: energie.klasse.col, color: "#fff" }}>
                  {energie.klasse.c}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {energie ? (
              <>
                <EnergyBar value={energie.endenergie} />
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Endenergie" value={`${energie.endenergie}`} unit="kWh/(m²·a)" />
                  <Stat label="Primärenergie" value={`${energie.primaerenergie}`} unit="kWh/(m²·a)" />
                  <Stat label="CO₂" value={`${energie.co2Tonnen} t`} unit="pro Jahr" />
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Bitte PLZ, Baujahr und Wohnfläche angeben, um die Vorschau zu sehen.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[var(--klard-teal-p)] border-[var(--klard-teal-l)]">
          <CardContent className="py-6 px-6 space-y-3">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Detaillierter Gebäudereport
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enthält passende Förderprogramme mit geschätzter Förderhöhe, empfohlene
              Maßnahmen mit Kostenspannen und Energieeinsparung sowie den vollständigen
              Energiebericht als PDF. Einmalig {REPORT_PRICE_LABEL} pro Objekt.
            </p>
            <Button
              className="w-full bg-[var(--klard-teal)] hover:bg-[var(--klard-teal-d)] text-white font-semibold h-11"
              disabled={!valid || pending}
              onClick={handleBuy}
              data-testid="button-buy-report"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Detaillierten Gebäudereport als PDF kaufen ({REPORT_PRICE_LABEL})
            </Button>
            {!valid && (
              <p className="text-xs text-muted-foreground text-center">
                Bitte vervollständigen Sie zuerst die Gebäudedaten (PLZ, Baujahr, Wohnfläche).
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
      {children}
      {hint && <span className="block mt-0.5 text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function SelectField({
  value, options, onChange, testId,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  testId?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm" data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
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
