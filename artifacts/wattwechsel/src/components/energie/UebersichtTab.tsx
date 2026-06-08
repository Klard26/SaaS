import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PortfolioKpi } from "@workspace/api-client-react";
import { Building2, Gauge, FileCheck2, CalendarClock, PiggyBank, TrendingDown } from "lucide-react";

function eur(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function UebersichtTab({
  kpi,
  onNavigate,
}: {
  kpi?: PortfolioKpi;
  onNavigate: (tab: string) => void;
}) {
  const cards = [
    { icon: Building2, label: "Objekte", value: String(kpi?.anzahlObjekte ?? 0) },
    { icon: Gauge, label: "Zählpunkte", value: String(kpi?.anzahlZaehlpunkte ?? 0) },
    { icon: FileCheck2, label: "Aktive Verträge", value: String(kpi?.aktiveVertraege ?? 0) },
    { icon: CalendarClock, label: "Kündbar in 60 Tagen", value: String(kpi?.kuendigungen60Tage ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--klard-green-l)] mb-3">
                <c.icon className="h-4.5 w-4.5 text-[var(--klard-green)]" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-foreground" data-testid={`kpi-${c.label}`}>{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-[var(--klard-green)]/30 bg-[var(--klard-green-l)]/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-[var(--klard-green)]">
              <PiggyBank className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-semibold">Realisierte Ersparnis</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground" data-testid="kpi-realisiert">
              {eur(kpi?.realisierteErsparnisEur ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">pro Jahr aus abgeschlossenen Wechseln</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-foreground">
              <TrendingDown className="h-5 w-5 text-[var(--klard-gold)]" aria-hidden="true" />
              <span className="text-sm font-semibold">Erkanntes Potenzial</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground" data-testid="kpi-potenzial">
              {eur(kpi?.potenzialErsparnisEur ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">aus offenen Empfehlungen, noch nicht freigegeben</p>
            <Button
              size="sm"
              onClick={() => onNavigate("wechsel")}
              className="mt-4 bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white"
              data-testid="button-zu-wechsel"
            >
              Wechsel prüfen
            </Button>
          </CardContent>
        </Card>
      </div>

      {(kpi?.anzahlObjekte ?? 0) === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Noch keine Objekte erfasst. Legen Sie Ihr erstes Objekt an, um Analysen zu starten.
            </p>
            <Button
              onClick={() => onNavigate("portfolio")}
              className="mt-4 bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white"
              data-testid="button-erstes-objekt"
            >
              Objekt anlegen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
