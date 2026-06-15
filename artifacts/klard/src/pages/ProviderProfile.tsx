import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import {
  useGetMyProviderProfile, getGetMyProviderProfileQueryKey,
  useUpdateProvider,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  displayName: z.string().min(2, "Mindestens 2 Zeichen"),
  bio: z.string().optional(),
  city: z.string().min(2, "Stadt ist erforderlich"),
  zip: z.string().min(4, "PLZ ist erforderlich"),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  companyLegalName: z.string().optional(),
  taxId: z.string().optional(),
  consultationMode: z.enum(["both", "online", "in-person"]).default("both"),
  responseTime: z.string().optional(),
  certificatesText: z.string().optional(),
  externalIcalUrl: z.string().url("Bitte eine gültige URL angeben").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function ProviderProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey() },
  });

  const updateProvider = useUpdateProvider();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "", bio: "", city: "", zip: "", address: "", phone: "", website: "",
      companyLegalName: "", taxId: "", consultationMode: "both", responseTime: "", certificatesText: "",
      externalIcalUrl: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName ?? "",
        bio: profile.bio ?? "",
        city: profile.city ?? "",
        zip: profile.zip ?? "",
        address: profile.address ?? "",
        phone: profile.phone ?? "",
        website: profile.website ?? "",
        companyLegalName: profile.companyLegalName ?? "",
        taxId: profile.taxId ?? "",
        consultationMode: (profile.consultationMode as "both" | "online" | "in-person") ?? "both",
        responseTime: profile.responseTime ?? "",
        certificatesText: (profile.certificates ?? []).join(", "),
        externalIcalUrl: profile.externalIcalUrl ?? "",
      });
    }
  }, [profile, form]);

  async function onSubmit(values: FormData) {
    if (!profile) return;
    try {
      const { certificatesText, ...rest } = values;
      const certificates = (certificatesText ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateProvider.mutateAsync({ id: profile.id, data: { ...rest, certificates } });
      qc.invalidateQueries({ queryKey: getGetMyProviderProfileQueryKey() });
      toast({ title: "Profil aktualisiert" });
    } catch {
      toast({ title: "Fehler", description: "Profil konnte nicht aktualisiert werden.", variant: "destructive" });
    }
  }

  if (!isLoading && !profile) {
    setLocation("/provider/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profil bearbeiten</h1>
          <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
            Zum Dashboard
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Berater-Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="displayName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name / Kanzleiname *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-displayName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profilbeschreibung</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} data-testid="textarea-bio" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stadt *</FormLabel>
                        <FormControl><Input {...field} data-testid="input-city" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="zip" render={({ field }) => (
                      <FormItem>
                        <FormLabel>PLZ *</FormLabel>
                        <FormControl><Input {...field} data-testid="input-zip" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl><Input {...field} data-testid="input-address" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl><Input {...field} data-testid="input-phone" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="website" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl><Input {...field} data-testid="input-website" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Unternehmensdaten für Angebote</h3>
                    <p className="text-xs text-muted-foreground mb-4">Diese Angaben erscheinen im KI-generierten Angebot.</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="companyLegalName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firmenname für Rechnung</FormLabel>
                          <FormControl><Input placeholder="z.B. Hoffmann Steuerberatung GmbH" {...field} data-testid="input-companyLegalName" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="taxId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Steuernummer / USt-IdNr.</FormLabel>
                          <FormControl><Input placeholder="z.B. DE123456789" {...field} data-testid="input-taxId" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Beratungsangebot</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="consultationMode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beratungsform</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger data-testid="select-consultationMode"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="both">Online & Vor-Ort</SelectItem>
                              <SelectItem value="online">Nur Online</SelectItem>
                              <SelectItem value="in-person">Nur Vor-Ort</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="responseTime" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reaktionszeit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger data-testid="select-responseTime"><SelectValue placeholder="Reaktionszeit wählen" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Innerhalb 2 Stunden">Innerhalb 2 Stunden</SelectItem>
                              <SelectItem value="Innerhalb 6 Stunden">Innerhalb 6 Stunden</SelectItem>
                              <SelectItem value="Innerhalb 24 Stunden">Innerhalb 24 Stunden</SelectItem>
                              <SelectItem value="Innerhalb 48 Stunden">Innerhalb 48 Stunden</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="mt-4">
                      <FormField control={form.control} name="certificatesText" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zertifikate / Mitgliedschaften</FormLabel>
                          <FormControl><Input placeholder="z.B. StB-Kammer Berlin, DATEV-Mitglied" {...field} data-testid="input-certificates" /></FormControl>
                          <p className="text-xs text-muted-foreground mt-1">Mehrere Einträge mit Komma trennen.</p>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="mt-4">
                      <FormField control={form.control} name="externalIcalUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Externer Kalender (iCal-URL)</FormLabel>
                          <FormControl><Input placeholder="https://...ics" {...field} data-testid="input-externalIcalUrl" /></FormControl>
                          <p className="text-xs text-muted-foreground mt-1">Termine aus diesem Kalender (z.B. Google, Outlook) blockieren automatisch Ihre Verfügbarkeit. Aktualisierung alle 15 Minuten.</p>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={updateProvider.isPending} data-testid="button-save-profile">
                    {updateProvider.isPending ? "Wird gespeichert..." : "Änderungen speichern"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
