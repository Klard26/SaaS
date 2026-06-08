import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListWechselvorgaenge, getListWechselvorgaengeQueryKey,
  useStarteAnalyse, useFreigebenWechsel, useAblehnenWechsel, useWidersprechenWechsel,
  getGetEnergiePortfolioQueryKey, getListAuditLogQueryKey,
  type PortfolioObjekt, type Wechselvorgang,
} from "@workspace/api-client-react";
import {
  SPARTE_LABELS, WECHSEL_STATUS_LABELS, ZAEHLER_ART_LABELS,
  wechselUebergangErlaubt,
  type Sparte, type WechselStatus, type ZaehlerArt,
} from "@workspace/energie-wechsel";

function eur(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

const STATUS_STYLE: Record<string, string> = {
  empfehlung: "border-[var(--klard-gold)] text-[var(--klard-gold)]",
  wartet_freigabe: "border-[var(--klard-gold)] text-[var(--klard-gold)]",
  freigegeben: "border-[var(--klard-green)] text-[var(--klard-green)]",
  kuendigung_alt: "border-[var(--klard-green)] text-[var(--klard-green)]",
  anmeldung_neu: "border-[var(--klard-green)] text-[var(--klard-green)]",
  aktiv: "border-[var(--klard-green)] text-[var(--klard-green)] bg-[var(--klard-green-l)]",
  abgelehnt: "border-destructive text-destructive",
  widersprochen: "border-destructive text-destructive",
  fehlgeschlagen: "border-destructive text-destructive",
  analyse: "border-muted-foreground text-muted-foreground",
};

export function WechselTab({ objekte }: { objekte: PortfolioObjekt[] }) {
  const { data: vorgaenge = [], isLoading } = useListWechselvorgaenge({
    query: { queryKey: getListWechselvorgaengeQueryKey() },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Wechselvorgänge</h2>
          <p className="text-sm text-muted-foreground">
            Starten Sie eine KI-Analyse je Zählpunkt und steuern Sie jeden Wechsel.
          </p>
        </div>
        <AnalyseDialog objekte={objekte} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : vorgaenge.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Noch keine Wechselvorgänge. Starten Sie eine Analyse.</CardContent></Card>
      ) : (
        vorgaenge.map((v) => <WechselCard key={v.id} v={v} />)
      )}
    </div>
  );
}

function WechselCard({ v }: { v: Wechselvorgang }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const freigeben = useFreigebenWechsel();
  const ablehnen = useAblehnenWechsel();
  const widersprechen = useWidersprechenWechsel();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListWechselvorgaengeQueryKey() });
    qc.invalidateQueries({ queryKey: getGetEnergiePortfolioQueryKey() });
    qc.invalidateQueries({ queryKey: getListAuditLogQueryKey() });
  }

  async function run(fn: () => Promise<unknown>, label: string) {
    try {
      await fn();
      invalidate();
      toast({ title: label });
    } catch (err) {
      toast({ title: "Fehler", description: err instanceof Error ? err.message : "Aktion fehlgeschlagen.", variant: "destructive" });
    }
  }

  const pending = freigeben.isPending || ablehnen.isPending || widersprechen.isPending;
  const ersparnis = v.ersparnisEurJahr ?? 0;
  const status = v.status as WechselStatus;
  const canFreigeben = wechselUebergangErlaubt(status, "freigegeben");
  const canAblehnen = wechselUebergangErlaubt(status, "abgelehnt");
  const canWidersprechen = wechselUebergangErlaubt(status, "widersprochen");
  const showActions = canFreigeben || canAblehnen || canWidersprechen;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--klard-green)]" aria-hidden="true" />
              <p className="font-semibold text-foreground" data-testid={`wechsel-${v.id}`}>
                Wechselvorgang #{v.id}
              </p>
            </div>
            {v.empfVersorger && (
              <p className="text-sm text-foreground mt-1.5">
                Empfehlung: <span className="font-medium">{v.empfVersorger}</span>
                {v.empfTarif ? ` – ${v.empfTarif}` : ""}
              </p>
            )}
            {v.anzahlVerglicheneAnbieter != null && (
              <p className="text-xs text-muted-foreground">{v.anzahlVerglicheneAnbieter} Anbieter verglichen</p>
            )}
          </div>
          <Badge variant="outline" className={STATUS_STYLE[v.status] ?? ""}>
            {WECHSEL_STATUS_LABELS[v.status as WechselStatus] ?? v.status}
          </Badge>
        </div>

        {ersparnis > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--klard-green-l)]/50 px-3 py-2">
            <span className="text-lg font-bold text-[var(--klard-green)]">{eur(ersparnis)}/Jahr</span>
            {v.ersparnisProzent != null && (
              <span className="text-xs text-[var(--klard-green)]">−{v.ersparnisProzent.toFixed(1)} %</span>
            )}
          </div>
        )}

        {v.kiBegruendung && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-l-2 border-[var(--klard-green)] pl-3">
            {v.kiBegruendung}
          </p>
        )}

        {v.widerspruchBis && v.status === "wartet_freigabe" && (
          <p className="mt-2 text-xs text-[var(--klard-gold)]">
            Widerspruch möglich bis {new Date(v.widerspruchBis).toLocaleDateString("de-DE")}
          </p>
        )}

        {showActions && (
          <div className="mt-4 flex flex-wrap gap-2">
            {canFreigeben && (
              <Button
                size="sm"
                disabled={pending}
                onClick={() => run(() => freigeben.mutateAsync({ id: v.id }), "Wechsel freigegeben")}
                className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white"
                data-testid={`button-freigeben-${v.id}`}
              >
                Freigeben <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
            {canWidersprechen && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run(() => widersprechen.mutateAsync({ id: v.id }), "Widerspruch erfasst")}
                data-testid={`button-widersprechen-${v.id}`}
              >
                Widersprechen
              </Button>
            )}
            {canAblehnen && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={pending}
                onClick={() => run(() => ablehnen.mutateAsync({ id: v.id }), "Wechsel abgelehnt")}
                data-testid={`button-ablehnen-${v.id}`}
              >
                Ablehnen
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyseDialog({ objekte }: { objekte: PortfolioObjekt[] }) {
  const [open, setOpen] = useState(false);
  const [zaehlpunktId, setZaehlpunktId] = useState<string>("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const analyse = useStarteAnalyse();

  const options = objekte.flatMap((o) =>
    o.zaehlpunkte.map(({ zaehlpunkt: z }) => ({
      id: z.id,
      label: `${o.objekt.bezeichnung} · ${SPARTE_LABELS[z.sparte as Sparte] ?? z.sparte} (${ZAEHLER_ART_LABELS[z.art as ZaehlerArt] ?? z.art})`,
    })),
  );

  async function start() {
    if (!zaehlpunktId) return;
    try {
      await analyse.mutateAsync({ data: { zaehlpunktId: Number(zaehlpunktId) } });
      qc.invalidateQueries({ queryKey: getListWechselvorgaengeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetEnergiePortfolioQueryKey() });
      qc.invalidateQueries({ queryKey: getListAuditLogQueryKey() });
      toast({ title: "Analyse abgeschlossen", description: "Die Empfehlung steht im Wechsel-Tab bereit." });
      setZaehlpunktId("");
      setOpen(false);
    } catch (err) {
      toast({ title: "Fehler", description: err instanceof Error ? err.message : "Analyse fehlgeschlagen.", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white" disabled={options.length === 0} data-testid="button-start-analyse">
          <Sparkles className="h-4 w-4 mr-1.5" /> KI-Analyse starten
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>KI-Tarifanalyse</DialogTitle>
          <DialogDescription>
            Wählen Sie einen Zählpunkt. WattWechsel vergleicht den Markt und erstellt eine neutrale Empfehlung.
          </DialogDescription>
        </DialogHeader>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Keine Zählpunkte vorhanden. Legen Sie zuerst Objekte und Zählpunkte im Portfolio-Tab an.
          </p>
        ) : (
          <div className="space-y-4">
            <Select value={zaehlpunktId} onValueChange={setZaehlpunktId}>
              <SelectTrigger data-testid="select-analyse-zaehlpunkt">
                <SelectValue placeholder="Zählpunkt wählen" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={start}
            disabled={!zaehlpunktId || analyse.isPending}
            className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white"
            data-testid="button-submit-analyse"
          >
            {analyse.isPending ? (<><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Analysiert…</>) : "Analyse starten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
