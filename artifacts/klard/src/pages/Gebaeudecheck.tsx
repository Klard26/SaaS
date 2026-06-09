import { useEffect, useState } from "react";
import { Show } from "@clerk/react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnergieVollanalyse } from "@/components/EnergieVollanalyse";
import { EnergieSchnellcheck } from "@/components/EnergieSchnellcheck";
import { ReportPreviewDemo } from "@/components/ReportPreviewDemo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { Trash2, Lock, Check, Loader2 } from "lucide-react";
import {
  useListAssessments,
  useCreateAssessment,
  useDeleteAssessment,
  useGetGebaeudecheckCredits,
  useCreateGebaeudecheckCheckout,
  useReconcileGebaeudecheckOrder,
  getListAssessmentsQueryKey,
  getGetGebaeudecheckCreditsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  calcEnergie, calcWert, calcValue, calcRestnutzung, calcRisk, calcESG, calcSolar,
  type BuildingInput,
} from "@workspace/energie-calc";

function eur(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default function Gebaeudecheck() {
  const [loadInto, setLoadInto] = useState<BuildingInput | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <section className="bg-[var(--klard-bg)] py-8 sm:py-12 px-4 sm:px-8 border-b border-border">
        <div className="max-w-[1280px] mx-auto">
          <span className="inline-block bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)] text-[0.7rem] font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-3">
            Gebäudecheck
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Energieklasse, Marktwert und Klimarisiko Ihrer Immobilie
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Der Schnellcheck mit Energieklasse ist für alle kostenlos. Den ausführlichen
            Report mit Energiebilanz, Wert &amp; Steuer, Risiko &amp; ESG, Sanierungsfahrplan
            und Solarpotenzial schalten Sie pro Objekt mit einem Guthaben frei.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-8 max-w-[1280px] mx-auto w-full flex-1 space-y-8">
        {/* Free quick check for everyone */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            Kostenloser Schnellcheck
          </div>
          <EnergieSchnellcheck variant="card" showCta={false} />
        </div>

        {/* Report preview / demo — shown to everyone to demonstrate the paid report */}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            So sieht Ihr ausführlicher Report aus
          </div>
          <div className="rounded-xl border border-border bg-[var(--klard-bg)]/40 p-4 sm:p-8">
            <ReportPreviewDemo />
            <p className="mx-auto mt-5 max-w-xl text-center text-sm text-muted-foreground leading-relaxed">
              Energiebilanz, Marktwert &amp; Steuer, Risiko &amp; ESG, Sanierungsfahrplan und
              Solarpotenzial — kompakt auf einen Blick und als PDF speicherbar. Schalten Sie
              den Report unten für Ihr Objekt frei.
            </p>
          </div>
        </div>

        {/* Detailed report */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Ausführlicher Report
            </div>
          </div>
          <Show when="signed-in">
            <SavedAssessments onLoad={setLoadInto} />
            <SignedInAnalyse initial={loadInto ?? undefined} />
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
            Mit einem kostenlosen Klard-Konto kaufen Sie Report-Guthaben, schalten
            ausführliche Analysen frei und speichern sie für später.
          </p>
        </div>
        <Link href="/sign-up">
          <Button data-testid="button-signup-cta">Kostenlos registrieren</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function SignedInAnalyse({ initial }: { initial?: BuildingInput }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const create = useCreateAssessment();
  const reconcile = useReconcileGebaeudecheckOrder();
  const { data: credits } = useGetGebaeudecheckCredits();
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  const balance = credits?.balance ?? 0;

  // Handle Stripe checkout redirect: ?credits=success&session_id=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("credits") === "success") {
      const sessionId = params.get("session_id");
      if (sessionId) {
        reconcile.mutateAsync({ data: { sessionId } })
          .then((res) => {
            qc.invalidateQueries({ queryKey: getGetGebaeudecheckCreditsQueryKey() });
            toast({
              title: res.granted ? "Guthaben gutgeschrieben" : "Bereits gutgeschrieben",
              description: `Aktuelles Guthaben: ${res.balance} Report${res.balance === 1 ? "" : "s"}.`,
            });
          })
          .catch(() => {
            toast({ title: "Guthaben konnte nicht bestätigt werden", variant: "destructive" });
          });
      }
      // Clean the query string, keep the path
      setLocation(location, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(input: BuildingInput, label: string) {
    setSaving(true);
    try {
      const result = buildResult(input);
      await create.mutateAsync({
        data: {
          label,
          inputJson: input as unknown as Record<string, unknown>,
          resultJson: result as unknown as Record<string, unknown>,
          addressJson: { plz: input.plz, city: input.city ?? null },
        },
      });
      setUnlocked(true);
      toast({ title: "Report freigeschaltet & gespeichert", description: label });
      qc.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetGebaeudecheckCreditsQueryKey() });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("no_credits") || msg.includes("402")) {
        toast({
          title: "Kein Guthaben",
          description: "Bitte kaufen Sie zuerst Report-Guthaben.",
          variant: "destructive",
        });
        setBuyOpen(true);
      } else {
        toast({
          title: "Freischalten fehlgeschlagen",
          description: msg || "Bitte später erneut versuchen.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <CreditBar balance={balance} onBuy={() => setBuyOpen(true)} />
      <EnergieVollanalyse
        initial={initial}
        onSave={handleSave}
        saving={saving}
        showSave
        gated
        unlocked={unlocked}
        balance={balance}
        onBuy={() => setBuyOpen(true)}
      />
      <BuyCreditsDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        packages={credits?.packages ?? []}
      />
    </div>
  );
}

function CreditBar({ balance, onBuy }: { balance: number; onBuy: () => void }) {
  return (
    <Card className="bg-secondary/30">
      <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-center sm:text-left">
          <span className="text-muted-foreground">Report-Guthaben: </span>
          <span className="font-semibold" data-testid="text-credit-balance">
            {balance} Report{balance === 1 ? "" : "s"}
          </span>
        </div>
        <Button variant={balance > 0 ? "outline" : "default"} onClick={onBuy} data-testid="button-open-buy">
          Guthaben kaufen
        </Button>
      </CardContent>
    </Card>
  );
}

function BuyCreditsDialog({
  open, onOpenChange, packages,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  packages: { id: string; credits: number; amountCents: number; label: string }[];
}) {
  const { toast } = useToast();
  const checkout = useCreateGebaeudecheckCheckout();
  const [pending, setPending] = useState<string | null>(null);

  async function buy(packageId: string) {
    setPending(packageId);
    try {
      const res = await checkout.mutateAsync({ data: { packageId } });
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
      setPending(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report-Guthaben kaufen</DialogTitle>
          <DialogDescription>
            1 Guthaben schaltet einen ausführlichen Gebäude-Report frei. Größere
            Pakete senken den Preis pro Report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {packages.map((p) => {
            const perReport = p.amountCents / p.credits;
            return (
              <button
                key={p.id}
                type="button"
                disabled={pending !== null}
                onClick={() => buy(p.id)}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-border p-4 text-left hover:border-foreground/40 disabled:opacity-60 transition-colors"
                data-testid={`button-buy-${p.id}`}
              >
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {p.label}
                    {p.credits >= 10 && (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--klard-teal-d)] bg-[var(--klard-teal-l)] px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Beliebt
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {eur(perReport)} pro Report
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{eur(p.amountCents)}</span>
                  {pending === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SavedAssessments({ onLoad }: { onLoad: (i: BuildingInput) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data = [] } = useListAssessments();
  const del = useDeleteAssessment();

  if (data.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="py-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Meine gespeicherten Reports
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-3 flex flex-col gap-2" data-testid={`saved-${a.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm">{a.label}</div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("Report löschen?")) return;
                    try {
                      await del.mutateAsync({ id: a.id });
                      toast({ title: "Gelöscht" });
                      qc.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
                    } catch {
                      toast({ title: "Löschen fehlgeschlagen", variant: "destructive" });
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  data-testid={`button-delete-${a.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(a.createdAt).toLocaleDateString("de-DE")}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  onLoad(a.inputJson as unknown as BuildingInput);
                  toast({ title: "Geladen", description: "Daten ins Formular übernommen." });
                }}
                data-testid={`button-load-${a.id}`}
              >
                In Formular laden
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function buildResult(d: BuildingInput) {
  const energie = calcEnergie(d);
  const wert = calcWert(d);
  return {
    energie,
    wert,
    value: calcValue(d, energie),
    restnutzung: calcRestnutzung(d, energie, wert),
    risk: calcRisk(d),
    esg: calcESG(energie),
    solar: calcSolar(d),
    generatedAt: new Date().toISOString(),
  };
}
