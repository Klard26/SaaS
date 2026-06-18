import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  useGetMyCustomerProfile,
  useUpsertMyCustomerProfile,
  useListCategories,
  getGetMyCustomerProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Check } from "lucide-react";
import { GuidedHeader } from "@/components/journey/GuidedHeader";

const MAX_INTERESSEN = 3;

// Marketing attribution — how the customer discovered Klard.
const QUELLEN = [
  { value: "google", label: "Google-Suche" },
  { value: "empfehlung", label: "Empfehlung (Freunde / Familie)" },
  { value: "social", label: "Social Media (Instagram, TikTok, LinkedIn …)" },
  { value: "werbung", label: "Online-Werbung" },
  { value: "presse", label: "Presse / Artikel" },
  { value: "berater", label: "Über einen Berater" },
  { value: "sonstiges", label: "Sonstiges" },
] as const;

const schema = z.object({
  strasse: z.string().min(1, "Bitte geben Sie Ihre Straße an"),
  hausnummer: z.string().min(1, "Pflichtfeld"),
  plz: z.string().min(1, "Pflichtfeld"),
  ort: z.string().min(1, "Bitte geben Sie Ihren Ort an"),
});

type FormData = z.infer<typeof schema>;

// Internal target validation — only same-origin internal paths.
function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/search";
  return raw;
}

export default function CustomerOnboarding() {
  const [, setLocation] = useLocation();
  const rawSearch = useSearch();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: existing } = useGetMyCustomerProfile();
  const { data: categories = [] } = useListCategories();
  const upsert = useUpsertMyCustomerProfile();

  const [interessen, setInteressen] = useState<string[]>([]);
  const [quelle, setQuelle] = useState<string>("");

  const redirectTo = safeRedirect(new URLSearchParams(rawSearch).get("redirect"));

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { strasse: "", hausnummer: "", plz: "", ort: "" },
  });

  useEffect(() => {
    if (existing) {
      form.reset({
        strasse: existing.strasse,
        hausnummer: existing.hausnummer,
        plz: existing.plz,
        ort: existing.ort,
      });
      setInteressen(existing.interessen ?? []);
      setQuelle(existing.quelle ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  function toggleInteresse(slug: string) {
    setInteressen((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_INTERESSEN) return prev;
      return [...prev, slug];
    });
  }

  async function onSubmit(values: FormData) {
    try {
      await upsert.mutateAsync({
        data: {
          strasse: values.strasse.trim(),
          hausnummer: values.hausnummer.trim(),
          plz: values.plz.trim(),
          ort: values.ort.trim(),
          interessen,
          quelle: quelle || null,
        },
      });
      qc.invalidateQueries({ queryKey: getGetMyCustomerProfileQueryKey() });
      toast({ title: "Willkommen bei Klard", description: "Ihr Konto ist eingerichtet." });
      setLocation(redirectTo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Profil konnte nicht gespeichert werden.";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <GuidedHeader
          icon={MapPin}
          title="Willkommen bei Klard"
          subtitle="Nur noch ein kurzer Schritt, dann können Sie Berater buchen."
        />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Ihre Angaben</CardTitle>
            <CardDescription>Pflichtfelder sind mit * markiert.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Ihre Anschrift *</h3>
                  <div className="grid sm:grid-cols-[2fr_1fr] gap-4">
                    <FormField control={form.control} name="strasse" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Straße *</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Musterstraße" {...field} data-testid="input-strasse" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="hausnummer" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hausnummer *</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. 12a" {...field} data-testid="input-hausnummer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid sm:grid-cols-[1fr_2fr] gap-4 mt-4">
                    <FormField control={form.control} name="plz" render={({ field }) => (
                      <FormItem>
                        <FormLabel>PLZ *</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. 10115" {...field} data-testid="input-plz" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="ort" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ort *</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Berlin" {...field} data-testid="input-ort" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Wofür interessieren Sie sich? (optional)
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Wählen Sie bis zu {MAX_INTERESSEN} Bereiche – wir richten Ihre Startseite danach aus.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const active = interessen.includes(c.slug);
                      const disabled = !active && interessen.length >= MAX_INTERESSEN;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleInteresse(c.slug)}
                          disabled={disabled}
                          data-testid={`chip-interesse-${c.slug}`}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${
                            active
                              ? "bg-primary text-white border-primary"
                              : disabled
                                ? "border-border text-muted-foreground/50 cursor-not-allowed"
                                : "border-border text-foreground hover:border-primary hover:text-primary"
                          }`}
                        >
                          {active && <Check className="h-3.5 w-3.5" />}
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Wie haben Sie Klard entdeckt? (optional)
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Diese Angabe hilft uns, Klard bekannter zu machen.
                  </p>
                  <Select value={quelle} onValueChange={setQuelle}>
                    <SelectTrigger data-testid="select-quelle" className="sm:max-w-sm">
                      <SelectValue placeholder="Bitte auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUELLEN.map((q) => (
                        <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={upsert.isPending} data-testid="button-submit-onboarding">
                  {upsert.isPending ? "Wird gespeichert..." : existing ? "Angaben speichern" : "Los geht's"}
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
