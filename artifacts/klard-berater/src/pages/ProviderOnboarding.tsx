import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { QualificationsForm, type QualificationsValue } from "@/components/QualificationsForm";
import { useCreateProvider, useGetMyProviderProfile, getGetMyProviderProfileQueryKey } from "@workspace/api-client-react";
import { useClassifiedCategories } from "@/lib/classification";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Upload, Loader2 } from "lucide-react";
import { useFileUploader, publicUrlForObjectPath } from "@/lib/upload";
import { GuidedHeader } from "@/components/journey/GuidedHeader";

const schema = z.object({
  displayName: z.string().min(2, "Mindestens 2 Zeichen"),
  companyLegalName: z.string().optional(),
  taxId: z.string().optional(),
  bio: z.string().min(20, "Mindestens 20 Zeichen"),
  category: z.string().min(1, "Bitte wählen Sie einen Fachbereich"),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  city: z.string().min(2, "Stadt ist erforderlich"),
  zip: z.string().min(4, "PLZ ist erforderlich"),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  consultationMode: z.enum(["both", "online", "in-person"]).default("both"),
  responseTime: z.string().optional(),
  certificatesText: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProviderOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { upload, isUploading } = useFileUploader();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [qualifications, setQualifications] = useState<QualificationsValue>({});

  const { categories, grouped } = useClassifiedCategories();
  const createProvider = useCreateProvider();

  const { data: existingProfile } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey(), retry: false },
  });
  useEffect(() => {
    if (existingProfile?.id) {
      setLocation("/dashboard");
    }
  }, [existingProfile?.id, setLocation]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "", companyLegalName: "", taxId: "", bio: "", category: "", city: "", zip: "",
      address: "", phone: "", website: "", logoUrl: "",
      consultationMode: "both", responseTime: "Innerhalb 24 Stunden", certificatesText: "",
    },
  });

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Maximal 5 MB erlaubt.", variant: "destructive" });
      return;
    }
    try {
      const objectPath = await upload(file);
      form.setValue("logoUrl", objectPath, { shouldDirty: true });
      setLogoPreview(URL.createObjectURL(file));
      toast({ title: "Logo hochgeladen" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload fehlgeschlagen";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    }
  }

  async function onSubmit(values: FormData) {
    try {
      const { certificatesText, ...rest } = values;
      const certificates = (certificatesText ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const hasQualifications = Object.keys(qualifications).length > 0;
      await createProvider.mutateAsync({
        data: { ...rest, certificates, ...(hasQualifications ? { qualifications } : {}) },
      });
      qc.invalidateQueries({ queryKey: getGetMyProviderProfileQueryKey() });
      toast({ title: "Profil eingereicht", description: "Freigabe ausstehend – nach der Prüfung durch Klard wird Ihr Profil automatisch veröffentlicht." });
      setLocation("/dashboard");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number }; status?: number } | undefined);
      if (status?.response?.status === 409 || status?.status === 409) {
        qc.invalidateQueries({ queryKey: getGetMyProviderProfileQueryKey() });
        toast({ title: "Profil vorhanden", description: "Sie haben bereits ein Berater-Profil." });
        setLocation("/dashboard");
        return;
      }
      const msg = err instanceof Error ? err.message : "Profil konnte nicht erstellt werden.";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <GuidedHeader
          icon={UserCheck}
          title="Als Berater registrieren"
          subtitle="Erstellen Sie Ihr Profil und erhalten Sie neue Mandanten über Klard."
          steps={["Profil", "Leistungen", "Verfügbarkeit"]}
          current={0}
        />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Ihr Berater-Profil</CardTitle>
            <CardDescription>Alle Pflichtfelder sind mit * markiert.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="displayName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name / Kanzleiname *</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Dr. Maria Hoffmann oder Hoffmann & Partner" {...field} data-testid="input-displayName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fachbereich *</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          setQualifications({});
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Fachbereich wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {grouped.map(wg =>
                            wg.areas.map(ag => (
                              <SelectGroup key={ag.area.id}>
                                <SelectLabel>{wg.world.title} · {ag.area.name}</SelectLabel>
                                {ag.categories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                              </SelectGroup>
                            )),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Berufsjahre</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={80} placeholder="z.B. 12" {...field} data-testid="input-yearsExperience" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Über mich / Über uns *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Beschreiben Sie Ihre Erfahrung, Spezialisierungen und was Mandanten bei Ihnen erwarten können..."
                        rows={4}
                        {...field}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Logo / Profilbild (optional)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Vorschau" className="w-full h-full object-cover" />
                      ) : form.watch("logoUrl") ? (
                        <img src={publicUrlForObjectPath(form.watch("logoUrl") ?? "")} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-muted cursor-pointer">
                      {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isUploading ? "Wird hochgeladen…" : "Datei wählen"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                        data-testid="input-logo"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG / JPG, max. 5 MB.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stadt *</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Berlin" {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="zip" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ *</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. 10115" {...field} data-testid="input-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Unter den Linden 21" {...field} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 30 12345678" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.kanzlei.de" {...field} data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Unternehmensdaten für Angebote</h3>
                  <p className="text-xs text-muted-foreground mb-4">Diese Angaben erscheinen automatisch im KI-generierten Angebot an Ihre Mandanten.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="companyLegalName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firmenname für Rechnung (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Hoffmann Steuerberatung GmbH" {...field} data-testid="input-companyLegalName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="taxId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Steuernummer / USt-IdNr. (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. DE123456789" {...field} data-testid="input-taxId" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Beratungsangebot</h3>
                  <p className="text-xs text-muted-foreground mb-4">Wie und wie schnell beraten Sie Ihre Mandanten?</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="consultationMode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beratungsform *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-consultationMode">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
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
                          <FormControl>
                            <SelectTrigger data-testid="select-responseTime">
                              <SelectValue placeholder="Reaktionszeit wählen" />
                            </SelectTrigger>
                          </FormControl>
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
                        <FormLabel>Zertifikate / Mitgliedschaften (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. StB-Kammer Berlin, DATEV-Mitglied, ISO 27001" {...field} data-testid="input-certificates" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Mehrere Einträge mit Komma trennen.</p>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <QualificationsForm
                  config={
                    (categories.find((c) => c.name === form.watch("category"))?.qualifications ?? null) as
                      | Parameters<typeof QualificationsForm>[0]["config"]
                  }
                  value={qualifications}
                  onChange={setQualifications}
                />

                <Button type="submit" className="w-full" disabled={createProvider.isPending} data-testid="button-submit-onboarding">
                  {createProvider.isPending ? "Wird erstellt..." : "Profil erstellen und starten"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
