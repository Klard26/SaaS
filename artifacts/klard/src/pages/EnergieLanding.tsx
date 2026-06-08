import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Zap,
  ShieldCheck,
  Building2,
  TrendingDown,
  FileSignature,
  ScanSearch,
  CheckCircle2,
} from "lucide-react";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "KI-Tarifanalyse",
    text: "Für jeden Zählpunkt vergleicht WattWechsel den Altvertrag mit dem gesamten Markt und ermittelt die realisierbare Ersparnis – neutral und nachvollziehbar.",
  },
  {
    icon: FileSignature,
    title: "Rechtssichere Vollmacht",
    text: "Granulare Vollmachten je Objekt und Sparte – von „nur Vorschläge“ bis „vollautomatisch“ mit Widerspruchsfrist. Jederzeit widerrufbar.",
  },
  {
    icon: TrendingDown,
    title: "Wechsel ohne Aufwand",
    text: "Kündigung des Altvertrags und Anmeldung des Neuvertrags laufen orchestriert im Hintergrund – Sie behalten die volle Kontrolle.",
  },
  {
    icon: ShieldCheck,
    title: "Lückenloses Audit",
    text: "Jeder Schritt – Empfehlung, Freigabe, Widerspruch, Abschluss – wird revisionssicher protokolliert. Transparenz für Eigentümer und WEG.",
  },
];

const STEPS = [
  { n: "1", title: "Portfolio anlegen", text: "Objekte, Zählpunkte und laufende Verträge erfassen – manuell oder per Import." },
  { n: "2", title: "Vollmacht festlegen", text: "Pro Objekt entscheiden Sie, ob WattWechsel nur vorschlägt oder selbst wechselt." },
  { n: "3", title: "KI analysiert", text: "Neutrale Marktanalyse je Zählpunkt mit konkreter Euro-Ersparnis und Begründung." },
  { n: "4", title: "Sie behalten die Kontrolle", text: "Freigeben, ablehnen oder widersprechen – alles dokumentiert im Cockpit." },
];

export default function EnergieLanding() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();

  const startHref = isSignedIn ? "/energie/portfolio" : "/sign-up";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[var(--klard-green-l)]/40 to-white">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--klard-green-l)] px-3 py-1 text-xs font-semibold text-[var(--klard-green)] mb-5">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            WattWechsel für die Wohnungswirtschaft
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.1]">
            Energiekosten senken für Ihr gesamtes Portfolio –{" "}
            <span className="text-[var(--klard-green)]">KI-gestützt und neutral.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            WattWechsel ist die neutrale Energiewechsel-Plattform für Hausverwalter und
            Bestandshalter. Analysieren, freigeben, wechseln – rechtssicher per Vollmacht,
            mit lückenlosem Audit-Trail für jeden Zählpunkt.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={() => setLocation(startHref)}
              className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white rounded-full px-7 h-12 text-sm font-semibold"
              data-testid="button-energie-start"
            >
              Kostenlos starten
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/energie/portfolio")}
              className="rounded-full border-[1.5px] px-7 h-12 text-sm font-semibold"
              data-testid="button-energie-cockpit"
            >
              Zum Cockpit
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--klard-green)]" aria-hidden="true" />
            Neutral – keine Provision einzelner Versorger verzerrt die Empfehlung.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--klard-green-l)] mb-4">
                <f.icon className="h-5 w-5 text-[var(--klard-green)]" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[var(--klard-bg)] border-y border-border">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
          <h2 className="text-2xl font-bold text-foreground text-center">So funktioniert WattWechsel</h2>
          <p className="mt-2 text-center text-muted-foreground max-w-xl mx-auto">
            In vier Schritten vom unübersichtlichen Vertragsbestand zum optimierten Portfolio.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-white p-6">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--klard-green)] text-white text-sm font-bold">
                  {s.n}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
        <div className="rounded-3xl bg-[var(--klard-ink)] px-8 py-12 text-center">
          <Building2 className="h-8 w-8 text-[var(--klard-green)] mx-auto" aria-hidden="true" />
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white">
            Bereit, Ihr Portfolio zu optimieren?
          </h2>
          <p className="mt-3 text-white/60 max-w-xl mx-auto">
            Legen Sie Ihr erstes Objekt an und sehen Sie in Minuten, wie viel Sie sparen können.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation(startHref)}
            className="mt-7 bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white rounded-full px-8 h-12 text-sm font-semibold"
            data-testid="button-energie-cta"
          >
            Jetzt kostenlos starten
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
