import { useState } from "react";
import { Show } from "@clerk/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnergieVollanalyse } from "@/components/EnergieVollanalyse";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2 } from "lucide-react";
import {
  useListAssessments,
  useCreateAssessment,
  useDeleteAssessment,
  getListAssessmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  calcEnergie, calcWert, calcValue, calcRestnutzung, calcRisk, calcESG, calcSolar,
  type BuildingInput,
} from "@workspace/energie-calc";

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
            Schnelle Vorab-Einschätzung für Eigentümer, Käufer und Investoren — vollständig
            kostenlos. Anschließend können Sie einen geprüften Energieberater direkt buchen.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-8 max-w-[1280px] mx-auto w-full flex-1">
        <Show when="signed-in">
          <SavedAssessments onLoad={setLoadInto} />
          <SignedInAnalyse initial={loadInto ?? undefined} />
        </Show>
        <Show when="signed-out">
          <AnonAnalyse />
        </Show>
      </section>

      <Footer />
    </div>
  );
}

function AnonAnalyse() {
  return (
    <>
      <EnergieVollanalyse />
      <Card className="mt-6 bg-secondary/30 border-dashed">
        <CardContent className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground text-center sm:text-left">
            Mit einem kostenlosen Klard-Konto können Sie Ihre Analysen speichern und
            später erneut aufrufen.
          </span>
          <Link href="/sign-up">
            <Button data-testid="button-signup-cta">Kostenlos registrieren</Button>
          </Link>
        </CardContent>
      </Card>
    </>
  );
}

function SignedInAnalyse({ initial }: { initial?: BuildingInput }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateAssessment();
  const [saving, setSaving] = useState(false);

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
      toast({ title: "Analyse gespeichert", description: label });
      qc.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
    } catch (e) {
      toast({
        title: "Speichern fehlgeschlagen",
        description: e instanceof Error ? e.message : "Bitte später erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return <EnergieVollanalyse initial={initial} onSave={handleSave} saving={saving} showSave />;
}

function SavedAssessments({ onLoad }: { onLoad: (i: BuildingInput) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data = [] } = useListAssessments();
  const del = useDeleteAssessment();

  if (data.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Meine gespeicherten Analysen
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-3 flex flex-col gap-2" data-testid={`saved-${a.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm">{a.label}</div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("Analyse löschen?")) return;
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
