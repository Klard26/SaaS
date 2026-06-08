import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Trash2, Gauge, FileText } from "lucide-react";
import {
  useCreateObjekt, useDeleteObjekt, useCreateZaehlpunkt, useDeleteZaehlpunkt, useCreateVertrag,
  getGetEnergiePortfolioQueryKey,
  type PortfolioObjekt,
} from "@workspace/api-client-react";
import {
  SPARTEN, SPARTE_LABELS, ZAEHLER_ARTEN, ZAEHLER_ART_LABELS,
  type Sparte, type ZaehlerArt,
} from "@workspace/energie-wechsel";

function useInvalidatePortfolio() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: getGetEnergiePortfolioQueryKey() });
}

export function PortfolioTab({ objekte }: { objekte: PortfolioObjekt[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground">Objekte &amp; Zählpunkte</h2>
        <ObjektDialog />
      </div>

      {objekte.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Noch keine Objekte. Legen Sie Ihr erstes Objekt an.
          </CardContent>
        </Card>
      ) : (
        objekte.map((o) => <ObjektCard key={o.objekt.id} item={o} />)
      )}
    </div>
  );
}

function ObjektCard({ item }: { item: PortfolioObjekt }) {
  const { objekt, zaehlpunkte } = item;
  const invalidate = useInvalidatePortfolio();
  const { toast } = useToast();
  const deleteObjekt = useDeleteObjekt();

  async function handleDelete() {
    try {
      await deleteObjekt.mutateAsync({ id: objekt.id });
      invalidate();
      toast({ title: "Objekt gelöscht" });
    } catch (err) {
      toast({ title: "Fehler", description: msg(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--klard-green-l)] shrink-0">
              <Building2 className="h-5 w-5 text-[var(--klard-green)]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-foreground" data-testid={`objekt-${objekt.id}`}>{objekt.bezeichnung}</p>
              <p className="text-sm text-muted-foreground">{objekt.strasse}, {objekt.plz} {objekt.ort}</p>
              {objekt.wegBeschluss && (
                <Badge variant="outline" className="mt-1.5 text-xs">WEG-Beschluss vorhanden</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ZaehlpunktDialog objektId={objekt.id} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" data-testid={`button-delete-objekt-${objekt.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Objekt löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    „{objekt.bezeichnung}“ und alle zugehörigen Zählpunkte und Verträge werden entfernt. Dies kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {zaehlpunkte.length > 0 && (
          <div className="mt-4 space-y-2 pl-1">
            {zaehlpunkte.map(({ zaehlpunkt: z, vertrag }) => (
              <div key={z.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3" data-testid={`zaehlpunkt-${z.id}`}>
                <div className="flex items-start gap-2.5">
                  <Gauge className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {SPARTE_LABELS[z.sparte as Sparte] ?? z.sparte} · {ZAEHLER_ART_LABELS[z.art as ZaehlerArt] ?? z.art}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {z.jahresverbrauchKwh != null ? `${z.jahresverbrauchKwh.toLocaleString("de-DE")} kWh/Jahr` : "Verbrauch unbekannt"}
                      {z.zaehlernummer ? ` · Zähler ${z.zaehlernummer}` : ""}
                    </p>
                    {vertrag ? (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" aria-hidden="true" />
                        {vertrag.versorger}
                        {vertrag.arbeitspreisCtKwh != null ? ` · ${vertrag.arbeitspreisCtKwh} ct/kWh` : ""}
                      </p>
                    ) : (
                      <VertragDialog zaehlpunktId={z.id} />
                    )}
                  </div>
                </div>
                <DeleteZaehlpunktButton zaehlpunktId={z.id} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteZaehlpunktButton({ zaehlpunktId }: { zaehlpunktId: number }) {
  const invalidate = useInvalidatePortfolio();
  const { toast } = useToast();
  const del = useDeleteZaehlpunkt();
  async function handle() {
    try {
      await del.mutateAsync({ id: zaehlpunktId });
      invalidate();
      toast({ title: "Zählpunkt gelöscht" });
    } catch (err) {
      toast({ title: "Fehler", description: msg(err), variant: "destructive" });
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" data-testid={`button-delete-zaehlpunkt-${zaehlpunktId}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zählpunkt löschen?</AlertDialogTitle>
          <AlertDialogDescription>Der Zählpunkt und sein Vertrag werden entfernt.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const objektSchema = z.object({
  bezeichnung: z.string().min(1, "Pflichtfeld"),
  strasse: z.string().min(1, "Pflichtfeld"),
  plz: z.string().min(4, "PLZ erforderlich").max(5),
  ort: z.string().min(1, "Pflichtfeld"),
});
type ObjektForm = z.infer<typeof objektSchema>;

function ObjektDialog() {
  const [open, setOpen] = useState(false);
  const invalidate = useInvalidatePortfolio();
  const { toast } = useToast();
  const create = useCreateObjekt();
  const form = useForm<ObjektForm>({
    resolver: zodResolver(objektSchema),
    defaultValues: { bezeichnung: "", strasse: "", plz: "", ort: "" },
  });

  async function onSubmit(values: ObjektForm) {
    try {
      await create.mutateAsync({ data: values });
      invalidate();
      toast({ title: "Objekt angelegt" });
      form.reset();
      setOpen(false);
    } catch (err) {
      toast({ title: "Fehler", description: msg(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white" data-testid="button-add-objekt">
          <Plus className="h-4 w-4 mr-1.5" /> Objekt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Objekt anlegen</DialogTitle>
          <DialogDescription>Erfassen Sie eine Liegenschaft Ihres Portfolios.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="bezeichnung" render={({ field }) => (
              <FormItem>
                <FormLabel>Bezeichnung *</FormLabel>
                <FormControl><Input placeholder="z.B. Wohnanlage Lindenhof" {...field} data-testid="input-objekt-bezeichnung" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="strasse" render={({ field }) => (
              <FormItem>
                <FormLabel>Straße *</FormLabel>
                <FormControl><Input placeholder="z.B. Lindenstraße 12" {...field} data-testid="input-objekt-strasse" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="plz" render={({ field }) => (
                <FormItem>
                  <FormLabel>PLZ *</FormLabel>
                  <FormControl><Input placeholder="10115" {...field} data-testid="input-objekt-plz" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ort" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ort *</FormLabel>
                  <FormControl><Input placeholder="Berlin" {...field} data-testid="input-objekt-ort" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending} className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white" data-testid="button-submit-objekt">
                {create.isPending ? "Speichern…" : "Anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const zpSchema = z.object({
  sparte: z.enum(SPARTEN as unknown as [Sparte, ...Sparte[]]),
  art: z.enum(ZAEHLER_ARTEN as unknown as [ZaehlerArt, ...ZaehlerArt[]]),
  zaehlernummer: z.string().optional(),
  jahresverbrauchKwh: z.coerce.number().int().min(0).optional(),
  netzbetreiber: z.string().optional(),
});
type ZpForm = z.infer<typeof zpSchema>;

function ZaehlpunktDialog({ objektId }: { objektId: number }) {
  const [open, setOpen] = useState(false);
  const invalidate = useInvalidatePortfolio();
  const { toast } = useToast();
  const create = useCreateZaehlpunkt();
  const form = useForm<ZpForm>({
    resolver: zodResolver(zpSchema),
    defaultValues: { sparte: "strom", art: "allgemeinstrom", zaehlernummer: "", netzbetreiber: "" },
  });

  async function onSubmit(values: ZpForm) {
    try {
      await create.mutateAsync({
        data: {
          objektId,
          sparte: values.sparte,
          art: values.art,
          zaehlernummer: values.zaehlernummer || null,
          jahresverbrauchKwh: values.jahresverbrauchKwh ?? null,
          netzbetreiber: values.netzbetreiber || null,
        },
      });
      invalidate();
      toast({ title: "Zählpunkt angelegt" });
      form.reset();
      setOpen(false);
    } catch (err) {
      toast({ title: "Fehler", description: msg(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-add-zaehlpunkt-${objektId}`}>
          <Plus className="h-4 w-4 mr-1.5" /> Zählpunkt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zählpunkt anlegen</DialogTitle>
          <DialogDescription>Strom-, Gas-, Wärme- oder Heizöl-Zählpunkt erfassen.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="sparte" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sparte *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-zp-sparte"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SPARTEN.map((s) => <SelectItem key={s} value={s}>{SPARTE_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="art" render={({ field }) => (
                <FormItem>
                  <FormLabel>Art *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-zp-art"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ZAEHLER_ARTEN.map((a) => <SelectItem key={a} value={a}>{ZAEHLER_ART_LABELS[a]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="jahresverbrauchKwh" render={({ field }) => (
              <FormItem>
                <FormLabel>Jahresverbrauch (kWh)</FormLabel>
                <FormControl><Input type="number" min={0} placeholder="z.B. 18500" {...field} data-testid="input-zp-verbrauch" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="zaehlernummer" render={({ field }) => (
                <FormItem>
                  <FormLabel>Zählernummer</FormLabel>
                  <FormControl><Input placeholder="optional" {...field} data-testid="input-zp-nummer" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="netzbetreiber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Netzbetreiber</FormLabel>
                  <FormControl><Input placeholder="optional" {...field} data-testid="input-zp-netz" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending} className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white" data-testid="button-submit-zaehlpunkt">
                {create.isPending ? "Speichern…" : "Anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const vertragSchema = z.object({
  versorger: z.string().min(1, "Pflichtfeld"),
  tarifname: z.string().optional(),
  arbeitspreisCtKwh: z.coerce.number().min(0).optional(),
  grundpreisEurJahr: z.coerce.number().min(0).optional(),
  kuendigungsfristTage: z.coerce.number().int().min(0).optional(),
  naechsterKuendigungstermin: z.string().optional(),
});
type VertragForm = z.infer<typeof vertragSchema>;

function VertragDialog({ zaehlpunktId }: { zaehlpunktId: number }) {
  const [open, setOpen] = useState(false);
  const invalidate = useInvalidatePortfolio();
  const { toast } = useToast();
  const create = useCreateVertrag();
  const form = useForm<VertragForm>({
    resolver: zodResolver(vertragSchema),
    defaultValues: { versorger: "", tarifname: "", kuendigungsfristTage: 30, naechsterKuendigungstermin: "" },
  });

  async function onSubmit(values: VertragForm) {
    try {
      await create.mutateAsync({
        data: {
          zaehlpunktId,
          versorger: values.versorger,
          tarifname: values.tarifname || null,
          arbeitspreisCtKwh: values.arbeitspreisCtKwh ?? null,
          grundpreisEurJahr: values.grundpreisEurJahr ?? null,
          kuendigungsfristTage: values.kuendigungsfristTage ?? null,
          naechsterKuendigungstermin: values.naechsterKuendigungstermin || null,
        },
      });
      invalidate();
      toast({ title: "Vertrag erfasst" });
      form.reset();
      setOpen(false);
    } catch (err) {
      toast({ title: "Fehler", description: msg(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs font-medium text-[var(--klard-green)] hover:underline mt-1" data-testid={`button-add-vertrag-${zaehlpunktId}`}>
          + Aktuellen Vertrag erfassen
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aktuellen Vertrag erfassen</DialogTitle>
          <DialogDescription>Grundlage für die Ersparnis-Analyse dieses Zählpunkts.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="versorger" render={({ field }) => (
              <FormItem>
                <FormLabel>Versorger *</FormLabel>
                <FormControl><Input placeholder="z.B. Stadtwerke Direkt" {...field} data-testid="input-vertrag-versorger" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tarifname" render={({ field }) => (
              <FormItem>
                <FormLabel>Tarifname</FormLabel>
                <FormControl><Input placeholder="z.B. Grundversorgung" {...field} data-testid="input-vertrag-tarif" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="arbeitspreisCtKwh" render={({ field }) => (
                <FormItem>
                  <FormLabel>Arbeitspreis (ct/kWh)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min={0} placeholder="z.B. 34.5" {...field} data-testid="input-vertrag-arbeitspreis" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="grundpreisEurJahr" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grundpreis (€/Jahr)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min={0} placeholder="z.B. 140" {...field} data-testid="input-vertrag-grundpreis" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="kuendigungsfristTage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kündigungsfrist (Tage)</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} data-testid="input-vertrag-frist" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="naechsterKuendigungstermin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nächster Kündigungstermin</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-vertrag-termin" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending} className="bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white" data-testid="button-submit-vertrag">
                {create.isPending ? "Speichern…" : "Erfassen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : "Aktion fehlgeschlagen.";
}
