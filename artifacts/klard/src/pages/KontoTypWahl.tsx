import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import {
  useUpsertMyImmobilienKunde,
  getGetMyImmobilienKundeQueryKey,
} from "@workspace/api-client-react";
import { KONTO_TYPEN } from "@/lib/kontoTypen";
import { Loader2 } from "lucide-react";

export default function KontoTypWahl() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const upsert = useUpsertMyImmobilienKunde();
  const [pending, setPending] = useState<string | null>(null);

  async function choose(value: string, commercial: boolean) {
    if (!commercial) {
      // Privatperson: save minimal profile inline, then go browse advisors.
      setPending(value);
      try {
        const name =
          user?.fullName?.trim() ||
          user?.primaryEmailAddress?.emailAddress ||
          "Privatkunde";
        await upsert.mutateAsync({
          data: {
            typ: "privat",
            firma: name,
            ansprechpartner: user?.fullName?.trim() || null,
            telefon: null,
            email: user?.primaryEmailAddress?.emailAddress ?? null,
            anzahlGebaeude: null,
            wohneinheitenGesamt: null,
          },
        });
        qc.invalidateQueries({ queryKey: getGetMyImmobilienKundeQueryKey() });
        toast({ title: "Willkommen bei Klard", description: "Ihr Konto ist startklar." });
        setLocation("/search");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Konto konnte nicht angelegt werden.";
        toast({ title: "Fehler", description: msg, variant: "destructive" });
        setPending(null);
      }
      return;
    }
    // Commercial customer: continue to the detailed profile, preselected.
    setLocation(`/immobilien/onboarding?typ=${value}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Willkommen bei Klard</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Damit wir Klard auf Sie zuschneiden können: Wer sind Sie? Sie buchen als Kunde –
            die Auswahl bestimmt, welche Funktionen wir Ihnen anzeigen.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {KONTO_TYPEN.map((t) => {
            const Icon = t.icon;
            const isPending = pending === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => choose(t.value, t.commercial)}
                disabled={pending !== null}
                className="group text-left rounded-xl border border-border bg-white p-5 transition-all hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid={`card-konto-${t.value}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {isPending ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {t.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Sie möchten Mandanten beraten und Termine anbieten?{" "}
            <button
              type="button"
              onClick={() => setLocation("/berater-werden")}
              className="text-primary font-semibold hover:underline"
              data-testid="link-to-berater"
            >
              Hier geht es zur Berater-Registrierung →
            </button>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
