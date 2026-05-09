import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/Navbar";
import {
  useGetMyProviderProfile, getGetMyProviderProfileQueryKey,
  useListProviderServices, getListProviderServicesQueryKey,
  useCreateService, useUpdateService, useDeleteService,
} from "@workspace/api-client-react";
import type { Service } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Clock } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Preis darf nicht negativ sein"),
  durationMinutes: z.coerce.number().min(15, "Mindestens 15 Minuten"),
});

type FormData = z.infer<typeof schema>;

export default function ProviderServices() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: profile, isLoading: profileLoading } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey() },
  });

  const { data: services = [], isLoading: servicesLoading } = useListProviderServices(
    profile?.id ?? 0,
    { query: { enabled: !!profile?.id, queryKey: getListProviderServicesQueryKey(profile?.id ?? 0) } }
  );

  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", price: 0, durationMinutes: 60 },
  });

  function openCreate() {
    setEditingService(null);
    form.reset({ name: "", description: "", price: 0, durationMinutes: 60 });
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description ?? "",
      price: service.price,
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
      toast({ title: "Leistung geloscht" });
    } catch {
      toast({ title: "Fehler", description: "Leistung konnte nicht geloscht werden.", variant: "destructive" });
    }
  }

  const isPending = createService.isPending || updateService.isPending;
  const isLoading = profileLoading || servicesLoading;

  if (!profileLoading && !profile) {
    setLocation("/provider/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Leistungen verwalten</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")} data-testid="button-back">
              Zum Dashboard
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-1.5" data-testid="button-add-service">
              <PlusCircle className="h-4 w-4" /> Leistung hinzufugen
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
              <p className="text-sm mt-1">Fugen Sie Leistungen hinzu, damit Mandanten buchen konnen.</p>
              <Button className="mt-4" onClick={openCreate} data-testid="button-add-first-service">
                Erste Leistung erstellen
              </Button>
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
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-semibold text-foreground">
                        {service.price === 0 ? "Kostenlos" : `${service.price} €`}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(service)} data-testid={`button-edit-${service.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(service.id)} data-testid={`button-delete-${service.id}`}>
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
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preis (€) *</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} data-testid="input-service-price" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dauer (Min.) *</FormLabel>
                    <FormControl><Input type="number" min={15} step={15} {...field} data-testid="input-service-duration" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Separator />
              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-service">
                {isPending ? "Wird gespeichert..." : (editingService ? "Anderungen speichern" : "Leistung erstellen")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
