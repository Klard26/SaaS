import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCreateProvider, useListCategories, getGetMyProviderProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Upload, Loader2 } from "lucide-react";
import { useFileUploader, publicUrlForObjectPath } from "@/lib/upload";

const schema = z.object({
  displayName: z.string().min(2, "Mindestens 2 Zeichen"),
  bio: z.string().min(20, "Mindestens 20 Zeichen"),
  category: z.string().min(1, "Bitte wählen Sie einen Fachbereich"),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  city: z.string().min(2, "Stadt ist erforderlich"),
  zip: z.string().min(4, "PLZ ist erforderlich"),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProviderOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { upload, isUploading } = useFileUploader();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: categories = [] } = useListCategories();
  const createProvider = useCreateProvider();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "", bio: "", category: "", city: "", zip: "",
      address: "", phone: "", website: "", logoUrl: "",
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
      await createProvider.mutateAsync({ data: values });
      qc.invalidateQueries({ queryKey: getGetMyProviderProfileQueryKey() });
      toast({ title: "Willkommen!", description: "Ihr Berater-Profil wurde erstellt." });
      setLocation("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Profil konnte nicht erstellt werden.";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <UserCheck className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Als Berater registrieren</h1>
          <p className="text-muted-foreground mt-2">Erstellen Sie Ihr Profil und erhalten Sie neue Mandanten über Klard.</p>
        </div>

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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Fachbereich wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
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

                <FormItem>
                  <FormLabel>Logo / Profilbild (optional)</FormLabel>
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
                </FormItem>

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
