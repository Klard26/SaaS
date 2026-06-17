import { FileText, Zap, Banknote, Shield, Sun, Hammer, MapPin } from "lucide-react";

/**
 * Branded A4 preview of the paid Gebäude-Report with sample data. Shown to all
 * users (especially signed-out visitors) to demonstrate the value of the report
 * before purchase. Purely presentational — no live data.
 */
export function ReportPreviewDemo() {
  return (
    <div className="relative">
      <div
        className="mx-auto w-full max-w-[760px] overflow-hidden rounded-xl border border-border bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)]"
        aria-label="Beispiel-Report"
      >
        {/* Letterhead */}
        <div className="flex items-start justify-between gap-4 border-b border-border bg-[var(--klard-bg)] px-6 py-5 sm:px-9">
          <div>
            <div className="flex items-center gap-2 text-[var(--klard-teal-d)]">
              <FileText className="h-5 w-5" />
              <span className="font-serif text-lg font-semibold">Klard Gebäude-Report</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Energieklasse · Marktwert · Klimarisiko · Sanierungsfahrplan
            </p>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div className="font-semibold text-foreground">Beispiel-Report</div>
            <div>Erstellt am 09.06.2026</div>
            <div>Report-Nr. KL-2026-0481</div>
          </div>
        </div>

        {/* Object header */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-6 py-4 sm:px-9">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-[var(--klard-teal-d)]" />
            <span className="font-medium text-foreground">Hauptstraße 12, 10115 Berlin</span>
          </div>
          <span className="text-xs text-muted-foreground">Mehrfamilienhaus · Baujahr 1962 · 480 m²</span>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-9">
          {/* Energy class hero */}
          <Section icon={<Zap className="h-4 w-4" />} title="Energiebilanz">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg text-white" style={{ background: "#f59e0b" }}>
                <span className="font-serif text-2xl font-bold leading-none">E</span>
                <span className="text-[9px]">Klasse</span>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Endenergie" value="168" unit="kWh/(m²·a)" />
                <Metric label="Primärenergie" value="201" unit="kWh/(m²·a)" />
                <Metric label="CO₂" value="34 t" unit="pro Jahr" />
                <Metric label="HT'" value="0,68" unit="W/(m²·K)" />
              </div>
            </div>
            <Bar />
          </Section>

          {/* Value & tax */}
          <Section icon={<Banknote className="h-4 w-4" />} title="Wert & Steuer">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Metric label="Marktwert (Schätzung)" value="1.840.000 €" unit="3.833 €/m²" />
              <Metric label="Sachwert (NHK 2010)" value="2.110.000 €" />
              <Metric label="AfA verkürzt 4,0 %" value="73.600 €" unit="pro Jahr" />
            </div>
            <Note tone="emerald">
              Steuergutachten lohnt sich: Mehrabschreibung ca. 41.200 €/Jahr, geschätzte
              Steuerersparnis 14.400 €/Jahr (bei Grenzsteuersatz 35 %).
            </Note>
          </Section>

          {/* Risk & ESG */}
          <Section icon={<Shield className="h-4 w-4" />} title="Risiko & ESG">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Standort-Score" value="22/100" unit="niedriges Risiko" />
              <Metric label="CRREM-Pfad" value="Stranding" unit="Nachrüstbedarf" />
              <Metric label="EU-Taxonomie" value="nicht konform" />
              <Metric label="Hitze/Trockenheit" value="2/3" />
            </div>
          </Section>

          {/* Renovation + solar two-up */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Section icon={<Hammer className="h-4 w-4" />} title="Sanierungsfahrplan">
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>· Klasse C — Dämmung + Wärmepumpe — 285.000 €</li>
                <li>· Klasse B — zzgl. Fenster + PV — 412.000 €</li>
              </ul>
            </Section>
            <Section icon={<Sun className="h-4 w-4" />} title="Solarpotenzial Dach">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Anlage" value="38 kWp" />
                <Metric label="Ersparnis" value="6.900 €" unit="pro Jahr" />
              </div>
            </Section>
          </div>

          <p className="border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
            Beispielhafte Darstellung. Alle Werte sind unverbindliche Schätzungen auf Basis
            vereinfachter Modelle (DIN V 18599, NHK 2010, ImmoWertV). Der vollständige Report
            wird auf Grundlage Ihrer Objektdaten erstellt und kann als PDF gespeichert werden.
          </p>
        </div>
      </div>

      {/* Watermark badge */}
      <div className="pointer-events-none absolute -right-2 -top-2 rotate-3 rounded-full bg-[var(--klard-teal-d)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-lg">
        Vorschau
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-[var(--klard-teal-d)]">{icon}</span>
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-2">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-serif text-sm font-semibold leading-tight text-foreground">{value}</div>
      {unit && <div className="text-[9px] text-muted-foreground">{unit}</div>}
    </div>
  );
}

function Bar() {
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full">
      {["#16a34a", "#65a30d", "#ca8a04", "#f59e0b", "#ea580c", "#dc2626", "#991b1b"].map((c, i) => (
        <div key={i} className="flex-1" style={{ background: c, opacity: i === 3 ? 1 : 0.45 }} />
      ))}
    </div>
  );
}

function Note({ tone, children }: { tone: "emerald"; children: React.ReactNode }) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : "bg-amber-50 border-amber-200 text-amber-900";
  return <div className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${cls}`}>{children}</div>;
}
