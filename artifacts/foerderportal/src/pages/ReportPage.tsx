import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileDown, ExternalLink, Loader2, ArrowRight, Building2, Landmark,
  CheckCircle2, Hammer,
} from "lucide-react";
import {
  calcEnergie, calcWert, calcValue, calcRestnutzung, calcRisk, calcESG,
  calcSolar, type BuildingInput,
} from "@workspace/energie-calc";
import {
  useListMyReports, useReconcileReport, useMatchFoerderschiene,
  type FoerderschieneReport, type FoerderMatchResult,
} from "@workspace/api-client-react";
import { printReport } from "@/lib/printReport";

const eurCents = (c: number) =>
  (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const eurWhole = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const dateFmt = (s: string) =>
  new Date(s).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

function isPaid(status: string) {
  return status === "paid" || status === "bezahlt" || status === "completed";
}

export default function ReportPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const reconcile = useReconcileReport();
  const { data: reports = [], isLoading, refetch } = useListMyReports();
  const [selected, setSelected] = useState<FoerderschieneReport | null>(null);
  const reconciledRef = useRef(false);

  useEffect(() => {
    if (reconciledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success" && params.get("session_id")) {
      reconciledRef.current = true;
      const sessionId = params.get("session_id") as string;
      reconcile
        .mutateAsync({ data: { sessionId } })
        .then(() => {
          toast({
            title: "Zahlung bestätigt",
            description: "Ihr Gebäudereport wurde freigeschaltet.",
          });
          refetch();
        })
        .catch(() => {
          toast({
            title: "Abgleich fehlgeschlagen",
            description: "Die Zahlung konnte nicht bestätigt werden. Bitte später erneut prüfen.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLocation(location.split("?")[0] || "/report", { replace: true });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paidReports = reports.filter((r) => isPaid(r.status));

  useEffect(() => {
    if (!selected && paidReports.length > 0) {
      setSelected(paidReports[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="bg-[var(--klard-bg)] py-8 px-4 sm:px-8 border-b border-border">
        <div className="max-w-[1280px] mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-1">
            Meine Gebäudereports
          </h1>
          <p className="text-muted-foreground text-sm">
            Förderprogramme, geschätzte Förderhöhe und Sanierungskosten zu Ihren Objekten.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-8 max-w-[1280px] mx-auto w-full flex-1 space-y-8">
        {/* Report list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && (
            <div className="col-span-full flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Reports werden geladen…
            </div>
          )}
          {!isLoading && reports.length === 0 && (
            <Card className="col-span-full border-dashed">
              <CardContent className="py-12 text-center space-y-3">
                <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Sie haben noch keinen Gebäudereport gekauft.
                </p>
                <Link href="/check">
                  <Button className="bg-[var(--klard-teal)] hover:bg-[var(--klard-teal-d)] text-white" data-testid="button-to-check">
                    Zum Gebäudecheck
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {reports.map((r) => {
            const paid = isPaid(r.status);
            const active = selected?.id === r.id;
            return (
              <Card
                key={r.id}
                className={`cursor-pointer transition-colors ${active ? "ring-2 ring-[var(--klard-teal)]" : ""}`}
                onClick={() => paid && setSelected(r)}
                data-testid={`report-card-${r.id}`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-foreground leading-snug">
                      {r.adresse || "Gebäudereport"}
                    </div>
                    <Badge
                      variant={paid ? "default" : "secondary"}
                      className={paid ? "bg-green-600 hover:bg-green-600 text-white shrink-0" : "shrink-0"}
                    >
                      {paid ? "Bezahlt" : "Ausstehend"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{dateFmt(r.createdAt)}</div>
                  <div className="text-xs text-muted-foreground">{eurCents(r.amountCents)}</div>
                  {paid && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-1 text-xs"
                      onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                      data-testid={`button-open-report-${r.id}`}
                    >
                      Report öffnen
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected report detail */}
        {selected && (
          <ReportDetail
            report={selected}
            eurCents={eurCents}
          />
        )}

        {/* CTA energieausweis */}
        <Card className="bg-[var(--klard-ink)] border-0">
          <CardContent className="py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-semibold text-white mb-1">
                Energieausweis benötigt?
              </h3>
              <p className="text-white/60 text-sm max-w-md">
                Bestellen Sie den rechtsgültigen Energieausweis — erstellt von einem
                zertifizierten Aussteller.
              </p>
            </div>
            <Link href="/energieausweis">
              <Button className="bg-[var(--klard-teal)] hover:bg-[var(--klard-teal-d)] text-white font-semibold shrink-0" data-testid="button-to-energieausweis">
                Energieausweis bestellen
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
}

function ReportDetail({
  report, eurCents,
}: {
  report: FoerderschieneReport;
  eurCents: (c: number) => string;
}) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const match = useMatchFoerderschiene();
  const [matchResult, setMatchResult] = useState<FoerderMatchResult | null>(null);

  const d = report.profil as unknown as BuildingInput;

  useEffect(() => {
    setMatchResult(null);
    match
      .mutateAsync({
        data: {
          baujahr: Number(d.baujahr) || 0,
          wohnflaeche: Number(d.wohnflaeche) || 0,
          wohneinheiten: Number(d.wohneinheiten) || null,
          heizung: String(d.heizung || ""),
          massnahmen: [],
          selbstgenutzt: null,
        },
      })
      .then(setMatchResult)
      .catch(() => {
        toast({
          title: "Förderabgleich nicht möglich",
          description: "Die Förderprogramme konnten nicht geladen werden.",
          variant: "destructive",
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id]);

  const e = calcEnergie(d);
  const w = calcWert(d);
  const val = calcValue(d, e);
  const rest = calcRestnutzung(d, e, w);
  const risk = calcRisk(d);
  const esg = calcESG(e);
  const solar = calcSolar(d);

  function handlePrint() {
    const ok = printReport(printRef.current, `Gebäudereport ${report.adresse ?? ""}`.trim());
    if (!ok) {
      toast({
        title: "Druckdialog blockiert",
        description: "Bitte erlauben Sie Pop-ups, um den Report als PDF zu speichern.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          {report.adresse || "Gebäudereport"}
        </h2>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="border-[1.5px] font-semibold"
          data-testid="button-print-report"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Als PDF speichern
        </Button>
      </div>

      <div ref={printRef} className="print-area space-y-6">
        {/* Energiebericht */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Energiebilanz</span>
              <Badge style={{ background: e.klasse.col, color: "#fff" }}>{e.klasse.c}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Metric label="Endenergie" value={`${e.endenergie}`} unit="kWh/(m²·a)" />
              <Metric label="Primärenergie" value={`${e.primaerenergie}`} unit="kWh/(m²·a)" />
              <Metric label="CO₂-Ausstoß" value={`${e.co2Tonnen} t`} unit="pro Jahr" />
              <Metric label="Heizwärmebedarf" value={`${e.qH}`} unit="kWh/(m²·a)" />
            </div>
          </CardContent>
        </Card>

        {/* Wert & Restnutzung */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Gebäudewert (Schätzung)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Metric label="Aktueller Wert" value={eurWhole(val.total)} />
              <Metric label="Pro m²" value={eurWhole(val.proQm)} />
              <Metric label="Sachwert (NHK)" value={eurWhole(w.wAktuell)} />
              <Metric label="Altersfaktor" value={`${Math.round(w.altersfaktor * 100)} %`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Restnutzung &amp; AfA</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Metric label="Gebäudealter" value={`${rest.alter} J.`} />
              <Metric label="Restnutzungsdauer" value={`${rest.rndWirtschaftlich} J.`} />
              <Metric label="AfA regulär" value={`${rest.afaRegulaer} %`} />
              <Metric label="AfA verkürzt" value={`${rest.afaVerkuerzt} %`} />
            </CardContent>
          </Card>
        </div>

        {/* Risk / ESG / Solar */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Klimarisiko</CardTitle></CardHeader>
            <CardContent>
              <Badge style={{ background: risk.color, color: "#fff" }}>{risk.level}</Badge>
              <p className="text-xs text-muted-foreground mt-2">Risikoindex: {risk.total}/100</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">ESG / Taxonomie</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">CRREM</span><span className="font-semibold">{esg.crrem}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">EU-Taxonomie</span><span className="font-semibold">{esg.euTaxonomie ? "Konform" : "Nicht konform"}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Solarpotenzial</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Metric label="Leistung" value={`${solar.kWp} kWp`} />
              <Metric label="Ertrag" value={`${solar.kWhJahr}`} unit="kWh/a" />
              <Metric label="Ersparnis" value={eurWhole(solar.ersparnisEur)} unit="pro Jahr" />
              <Metric label="Dachfläche" value={`${solar.potenzialQm} m²`} />
            </CardContent>
          </Card>
        </div>

        {/* FÖRDERUNG */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4 text-[var(--klard-teal-d)]" />
              Passende Förderprogramme
            </CardTitle>
          </CardHeader>
          <CardContent>
            {match.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Förderprogramme werden abgeglichen…
              </div>
            )}
            {matchResult && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[var(--klard-teal-l)] border border-[var(--klard-teal)] p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--klard-ink)]">Geschätzte Förderung gesamt</span>
                  <span className="font-serif text-2xl font-bold text-[var(--klard-teal-d)]" data-testid="text-foerderung-gesamt">
                    {eurWhole(matchResult.geschaetzteFoerderungEur)}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {matchResult.programme.map((p) => (
                    <div key={p.id} className="rounded-lg border border-border p-4 space-y-2" data-testid={`foerder-programm-${p.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-snug text-foreground">{p.titel}</h4>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <Badge variant="secondary" className="text-[0.6rem]">{p.foerdergeber}</Badge>
                          <Badge variant="outline" className="text-[0.6rem]">{p.art}</Badge>
                        </div>
                      </div>
                      <div className="inline-flex w-fit items-center rounded-full bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)] text-xs font-semibold px-2.5 py-0.5">
                        {p.foerderquoteText}
                      </div>
                      <p className="text-xs text-muted-foreground">Max.: {p.maxBetragText}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.kurzbeschreibung}</p>
                      {p.besonderheit && (
                        <p className="text-xs text-[var(--klard-teal-d)] leading-relaxed">{p.besonderheit}</p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        {typeof p.erfolgsquote === "number" && (
                          <span className="text-[0.65rem] text-muted-foreground">Erfolgsquote: {Math.round(p.erfolgsquote * 100)} %</span>
                        )}
                        {p.quelleUrl && (
                          <a
                            href={p.quelleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[0.65rem] font-medium text-[var(--klard-teal-d)] inline-flex items-center gap-1 hover:underline"
                            data-testid={`link-quelle-${p.id}`}
                          >
                            Zur Quelle <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MASSNAHMEN */}
        {matchResult && matchResult.massnahmen.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Hammer className="h-4 w-4 text-[var(--klard-teal-d)]" />
                Empfohlene Maßnahmen &amp; Kosten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {matchResult.massnahmen.map((m) => (
                <div key={m.id} className="rounded-lg border border-border p-4" data-testid={`massnahme-${m.id}`}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--klard-teal-d)] shrink-0" />
                      <h4 className="font-semibold text-sm text-foreground">{m.label}</h4>
                    </div>
                    <Badge variant="outline" className="text-[0.6rem] shrink-0">
                      {m.art === "komplettsanierung" ? "Komplettsanierung" : "Einzelmaßnahme"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{m.beschreibung}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                    <span className="text-foreground">
                      <span className="text-muted-foreground">Kosten: </span>
                      {eurWhole(m.kostenMin)} – {eurWhole(m.kostenMax)}
                    </span>
                    <span className="text-foreground">
                      <span className="text-muted-foreground">Einsparung: </span>{m.einsparung}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 border border-border p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
      <div className="font-serif text-base font-semibold text-foreground leading-tight">{value}</div>
      {unit && <div className="text-[10px] text-muted-foreground">{unit}</div>}
    </div>
  );
}
