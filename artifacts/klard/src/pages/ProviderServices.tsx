import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  useGetMyProviderProfile, getGetMyProviderProfileQueryKey,
  useListProviderServices, getListProviderServicesQueryKey,
  useListServiceTemplates,
  useCreateService, useUpdateService, useDeleteService,
} from "@workspace/api-client-react";
import type { Service, ServiceTemplate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Clock, Sparkles } from "lucide-react";
import { formatPriceEUR } from "@/lib/dateFmt";

const schema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen"),
  description: z.string().optional(),
  netPrice: z.coerce.number().min(0, "Preis darf nicht negativ sein"),
  vatRate: z.coerce.number().min(0).max(30).default(19),
  durationMinutes: z.coerce.number().min(15, "Mindestens 15 Minuten"),
});

type FormData = z.infer<typeof schema>;

export default function ProviderServices() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [pickedTemplateIds, setPickedTemplateIds] = useState<Set<number>>(new Set());

  const { data: profile, isLoading: profileLoading } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey() },
  });

  const { data: services = [], isLoading: servicesLoading } = useListProviderServices(
    profile?.id ?? 0,
    { query: { enabled: !!profile?.id, queryKey: getListProviderServicesQueryKey(profile?.id ?? 0) } }
  );

  const { data: templates = [] } = useListServiceTemplates(
    { category: profile?.categorySlug ?? "" },
    {
      query: {
        enabled: !!profile?.categorySlug,
        queryKey: ["serviceTemplates", profile?.categorySlug ?? ""],
      },
    }
  );

  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", netPrice: 0, vatRate: 19, durationMinutes: 60 },
  });

  const watchedNet = form.watch("netPrice");
  const watchedVat = form.watch("vatRate");
  const grossPreview =
    Number.isFinite(Number(watchedNet)) && Number.isFinite(Number(watchedVat))
      ? Number(watchedNet) * (1 + Number(watchedVat) / 100)
      : 0;

  function openCreate() {
    setEditingService(null);
    form.reset({ name: "", description: "", netPrice: 0, vatRate: 19, durationMinutes: 60 });
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    const net = service.netPrice ?? +(service.price / (1 + service.vatRate / 100)).toFixed(2);
    form.reset({
      name: service.name,
      description: service.description ?? "",
      netPrice: net,
      vatRate: service.vatRate,
      durationMinutes: service.durationMinutes,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormData) {
    if (!profile) return;
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, data: values });
      } else {
        await createService.mutateAsync({ id: profile.id, data: values });
      }
      qc.invalidateQueries({ queryKey: getListProviderServicesQueryKey(profile.id) });
      toast({ title: editingService ? "Leistung aktualisiert" : "Leistung erstellt" });
      setDialogOpen(false);
    } catch {
      toast({ title: "Fehler", description: "Leistung konnte nicht gespeichert werden.", variant: "destructive" });
    }
  }

  async function handleDelete(serviceId: number) {
    if (!profile) return;
    try {
      await deleteService.mutateAsync({ id: serviceId });
      qc.invalidateQueries({ queryKey: getListProviderServicesQueryKey(profile.id) });
      toast({ title: "Leistung gelöscht" });
    } catch {
      toast({ title: "Fehler", description: "Leistung konnte nicht gelöscht werden.", variant: "destructive" });
    }
  }

  function toggleTemplate(id: number) {
    setPickedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function applyTemplates() {
    if (!profile) return;
    const picks = templates.filter((t) => pickedTemplateIds.has(t.id));
    if (picks.length === 0) {
      setTemplateDialogOpen(false);
      return;
    }
    try {
      for (const t of picks) {
        await createService.mutateAsync({
          id: profile.id,
          data: {
            name: t.name,
            description: t.description ?? undefined,
            netPrice: t.defaultPrice ?? 0,
            vatRate: 19,
            durationMinutes: t.defaultDurationMinutes,
          },
        });
      }
      qc.invalidateQueries({ queryKey: getListProviderServicesQueryKey(profile.id) });
      toast({ title: `${picks.length} Leistung(en) hinzugefügt` });
      setPickedTemplateIds(new Set());
      setTemplateDialogOpen(false);
    } catch {
      toast({ title: "Fehler", description: "Vorlagen konnten nicht übernommen werden.", variant: "destructive" });
    }
  }

  useEffect(() => {
    if (templateDialogOpen) setPickedTemplateIds(new Set());
  }, [templateDialogOpen]);

  const isPending = createService.isPending || updateService.isPending;
  const isLoading = profileLoading || servicesLoading;

  if (!profileLoading && !profile) {
    setLocation("/provider/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">Leistungen verwalten</h1>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")} data-testid="button-back">
              Zum Dashboard
            </Button>
            {templates.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplateDialogOpen(true)}
                className="gap-1.5"
                data-testid="button-templates"
              >
                <Sparkles className="h-4 w-4" /> Aus Vorlagen
              </Button>
            )}
            <Button size="sm" onClick={openCreate} className="gap-1.5" data-testid="button-add-service">
              <PlusCircle className="h-4 w-4" /> Leistung hinzufügen
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <PlusCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Noch keine Leistungen</p>
              <p className="text-sm mt-1">Wählen Sie aus Vorlagen oder fügen Sie individuelle Leistungen hinzu.</p>
              <div className="flex gap-2 justify-center mt-4">
                {templates.length > 0 && (
                  <Button variant="outline" onClick={() => setTemplateDialogOpen(true)} data-testid="button-add-from-templates">
                    Aus Vorlagen wählen
                  </Button>
                )}
                <Button onClick={openCreate} data-testid="button-add-first-service">
                  Eigene erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">{services.length} Leistung{services.length !== 1 ? "en" : ""}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {services.map(service => (
                  <div key={service.id} className="flex items-center gap-4 py-4" data-testid={`row-service-${service.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{service.name}</p>
                      {service.description && <p className="text-sm text-muted-foreground mt-0.5 truncate">{service.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {service.durationMinutes} Min.
                        </span>
                        {service.netPrice != null && (
                          <span className="text-xs text-muted-foreground">
                            netto {formatPriceEUR(service.netPrice)} · {service.vatRate}% MwSt.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-semibold text-foreground">
                        {service.price === 0 ? "Kostenlos" : formatPriceEUR(service.price)}
                      </span>
                      <p className="text-[10px] text-muted-foreground">brutto</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(service)} aria-label="Bearbeiten" data-testid={`button-edit-${service.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(service.id)} aria-label="Löschen" data-testid={`button-delete-${service.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? "Leistung bearbeiten" : "Neue Leistung"}</DialogTitle>
            <DialogDescription>
              Geben Sie den Nettopreis ein. Der Bruttopreis wird automatisch mit dem Mehrwertsteuersatz berechnet.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input placeholder="z.B. Jahresabschluss" {...field} data-testid="input-service-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl><Textarea placeholder="Was ist in dieser Leistung enthalten?" rows={2} {...field} data-testid="textarea-service-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="netPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Netto (€) *</FormLabel>
                    <FormControl><Input type="number" min={0} step="0.01" {...field} data-testid="input-service-net" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vatRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>MwSt. %</FormLabel>
                    <FormControl><Input type="number" min={0} max={30} step="0.1" {...field} data-testid="input-service-vat" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dauer Min. *</FormLabel>
                    <FormControl><Input type="number" min={15} step={15} {...field} data-testid="input-service-duration" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                Brutto: <strong>{formatPriceEUR(grossPreview)}</strong>
              </div>
              <Separator />
              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-service">
                {isPending ? "Wird gespeichert..." : (editingService ? "Änderungen speichern" : "Leistung erstellen")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Leistungen aus Vorlagen wählen</DialogTitle>
            <DialogDescription>
              Wählen Sie eine oder mehrere typische Leistungen für Ihren Fachbereich. Sie können diese später anpassen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 -mr-1">
            <ul className="space-y-1">
              {templates.map((t: ServiceTemplate) => {
                const checked = pickedTemplateIds.has(t.id);
                return (
                  <li key={t.id}>
                    <label
                      className="flex items-start gap-3 rounded-md p-2 hover:bg-muted cursor-pointer"
                      data-testid={`template-row-${t.id}`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTemplate(t.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.name}</p>
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.defaultDurationMinutes} Min.
                          {t.defaultPrice != null ? ` · ab ${formatPriceEUR(t.defaultPrice)} netto` : ""}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTemplateDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={applyTemplates} disabled={pickedTemplateIds.size === 0 || createService.isPending} data-testid="button-apply-templates">
              {createService.isPending ? "Wird hinzugefügt…" : `${pickedTemplateIds.size} hinzufügen`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
