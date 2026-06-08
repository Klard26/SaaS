import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, FileSignature, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListVollmachten, getListVollmachtenQueryKey,
  useCreateVollmacht, useUpdateVollmachtStatus,
  getListAuditLogQueryKey,
  type PortfolioObjekt,
} from "@workspace/api-client-react";
import {
  SPARTEN, SPARTE_LABELS,
  VOLLMACHT_MODUS_LABELS, VOLLMACHT_STATUS_LABELS,
  vollmachtUebergangErlaubt,
  type Sparte, type VollmachtModus, type VollmachtStatus,
} from "@workspace/energie-wechsel";

const MODI: VollmachtModus[] = ["nur_vorschlag", "freigabe_erforderlich", "vollautomatisch"];

const STATUS_STYLE: Record<string, string> = {
  aktiv: "border-[var(--klard-green)] text-[var(--klard-green)]",
  entwurf: "border-muted-foreground text-muted-foreground",
  pausiert: "border-[var(--klard-gold)] text-[var(--klard-gold)]",
  widerrufen: "border-destructive text-destructive",
  abgelaufen: "border-muted-foreground text-muted-foreground",
};

export function VollmachtenTab({ objekte }: { objekte: PortfolioObjekt[] }) {
  const { data: vollmachten = [], isLoading } = useListVollmachten({
    query: { queryKey: getListVollmachtenQueryKey() },
  });
  const objektName = (id?: number | null) =>
    id == null ? "Gesamtes Portfolio" : (objekte.find((o) => o.objekt.id === id)?.objekt.bezeichnung ?? `Objekt #${id}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vollmachten</h2>
          <p className="text-sm text-muted-foreground">
            Legen Sie fest, in welchem Umfang WattWechsel für Sie handeln darf. Jederzeit widerrufbar.
          </p>
        </div>
        <VollmachtDialog objekte={objekte} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : vollmachten.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Noch keine Vollmachten erteilt.</CardContent></Card>
      ) : (
        vollmachten.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--klard-green-l)] shrink-0">
                    <FileSignature className="h-5 w-5 text-[var(--klard-green)]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground" data-testid={`vollmacht-${v.id}`}>
                      {objektName(v.objektId)}
                      {v.sparte ? ` · ${SPARTE_LABELS[v.sparte as Sparte] ?? v.sparte}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">{VOLLMACHT_MODUS_LABELS[v.modus as VollmachtModus] ?? v.modus}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {v.darfKuendigen && <Badge variant="secondary" className="text-xs">Kündigung</Badge>}
                      {v.darfAbschliessen && <Badge variant="secondary" className="text-xs">Abschluss</Badge>}
                      {v.darfSonderkuendigung && <Badge variant="secondary" className="text-xs">Sonderkündigung</Badge>}
                      {v.darfDatenAbfragen && <Badge variant="secondary" className="text-xs">Datenabfrage</Badge>}
                      <Badge variant="secondary" className="text-xs">Widerspruchsfrist {v.widerspruchsfristTage} Tage</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={STATUS_STYLE[v.status] ?? ""}>
                    {VOLLMACHT_STATUS_LABELS[v.status as VollmachtStatus] ?? v.status}
                  </Badge>
                  <StatusActions id={v.id} status={v.status as VollmachtStatus} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function StatusActions({ id, status }: { id: number; status: VollmachtStatus }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateVollmachtStatus();

  async function setStatus(next: "aktiv" | "pausiert" | "widerrufen", label: string) {
    try {
      await update.mutateAsync({ id, data: { status: next } });
      qc.invalidateQueries({ queryKey: getListVollmachtenQueryKey() });
      qc.invalidateQueries({ queryKey: getListAuditLogQueryKey() });
      toast({ title: label });
    } catch (err) {
      toast({ title: "Fehler", description: err instanceof Error ? err.message : "Aktion fehlgeschlagen.", variant: "destructive" });
    }
  }

  const canActivate = vollmachtUebergangErlaubt(status, "aktiv");
  const canPause = vollmachtUebergangErlaubt(status, "pausiert");
  const canRevoke = vollmachtUebergangErlaubt(status, "widerrufen");

  if (!canActivate && !canPause && !canRevoke) return null;

  return (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {canActivate && (
        <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => setStatus("aktiv", "Vollmacht aktiviert")} data-testid={`button-vollmacht-aktiv-${id}`}>
          Aktivieren
        </Button>
      )}
      {canPause && (
        <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => setStatus("pausiert", "Vollmacht pausiert")} data-testid={`button-vollmacht-pause-${id}`}>
          Pausieren
        </Button>
      )}
      {canRevoke && (
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={update.isPending} onClick={() => setStatus("widerrufen", "Vollmacht widerrufen")} data-testid={`button-vollmacht-widerruf-${id}`}>
          Widerrufen
        </Button>
      )}
    </div>
  );
}

const schema = z.object({
  objektId: z.string(),
  sparte: z.string(),
  modus: z.enum(MODI as unknown as [VollmachtModus, ...VollmachtModus[]]),
  darfKuendigen: z.boolean().default(true),
  darfAbschliessen: z.boolean().default(true),
  darfSonderkuendigung: z.boolean().default(false),
  darfDatenAbfragen: z.boolean().default(true),
  widerspruchsfristTage: z.coerce.number().int().min(1).max(60).default(14),
});
type VForm = z.infer<typeof schema>;

function VollmachtDialog({ objekte }: { objekte: PortfolioObjekt[] }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateVollmacht();
  const form = useForm<VForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      objektId: "alle", sparte: "alle", modus: "freigabe_erforderlich",
      darfKuendigen: true, darfAbschliessen: true, darfSonderkuendigung: false, darfDatenAbfragen: true,
      widerspruchsfristTage: 14,
    },
  });

  async function onSubmit(values: VForm) {
    try {
      await create.mutateAsync({
        data: {
          objektId: values.objektId === "alle" ? null : Number(values.objektId),
          sparte: values.sparte === "alle" ? undefined : (values.sparte as Sparte),
          modus: values.modus,
          darfKuendigen: values.darfKuendigen,
          darfAbschliessen: values.darfAbschliessen,
          darfSonderkuendigung: values.darfSonderkuendigung,
          darfDatenAbfragen: values.darfDatenAbfragen,
          widerspruchsfristTage: values.widerspruchsfristTage,
        },
      });
      qc.invalidateQueries({ queryKey: getListVollmachtenQueryKey() });
      qc.invalidateQueries({ queryKey: getListAuditLogQueryKey() });
      toast({ title: "Vollmacht erstellt", description: "Sie ist als Entwurf angelegt – jetzt aktivieren." });
      form.reset();
      setOpen(false);
    } catch (err) {
      toast({ title: "Fehler", description: err instanceof Error ? err.message : "Aktion fehlgeschlagen.", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white" data-testid="button-add-vollmacht">
          <Plus className="h-4 w-4 mr-1.5" /> Vollmacht
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vollmacht erteilen</DialogTitle>
          <DialogDescription>Umfang und Modus festlegen. Die Vollmacht wird als Entwurf angelegt.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="objektId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Geltungsbereich</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-vollmacht-objekt"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="alle">Gesamtes Portfolio</SelectItem>
                      {objekte.map((o) => <SelectItem key={o.objekt.id} value={String(o.objekt.id)}>{o.objekt.bezeichnung}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sparte" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sparte</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-vollmacht-sparte"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="alle">Alle Sparten</SelectItem>
                      {SPARTEN.map((s) => <SelectItem key={s} value={s}>{SPARTE_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="modus" render={({ field }) => (
              <FormItem>
                <FormLabel>Modus *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger data-testid="select-vollmacht-modus"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {MODI.map((m) => <SelectItem key={m} value={m}>{VOLLMACHT_MODUS_LABELS[m]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="widerspruchsfristTage" render={({ field }) => (
              <FormItem>
                <FormLabel>Widerspruchsfrist (Tage)</FormLabel>
                <FormControl><Input type="number" min={1} max={60} {...field} data-testid="input-vollmacht-frist" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-2.5 rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">Umfang</p>
              {([
                ["darfKuendigen", "Altvertrag kündigen"],
                ["darfAbschliessen", "Neuvertrag abschließen"],
                ["darfSonderkuendigung", "Sonderkündigung ausüben"],
                ["darfDatenAbfragen", "Verbrauchsdaten abfragen"],
              ] as const).map(([name, label]) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2.5 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid={`checkbox-${name}`} />
                    </FormControl>
                    <FormLabel className="font-normal">{label}</FormLabel>
                  </FormItem>
                )} />
              ))}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending} className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white" data-testid="button-submit-vollmacht">
                {create.isPending ? "Speichern…" : "Vollmacht anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
