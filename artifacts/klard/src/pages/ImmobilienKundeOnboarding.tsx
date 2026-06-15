import { useEffect } from "react";
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
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import {
  useGetMyImmobilienKunde,
  useUpsertMyImmobilienKunde,
  getGetMyImmobilienKundeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";
import { KONTO_TYPEN, KONTO_TYP_VALUES, isCommercialTyp } from "@/lib/kontoTypen";

const TYP_TUPLE = [
  "privat",
  "hausverwaltung",
  "makler",
  "bestandshalter",
  "bautraeger",
  "genossenschaft",
  "gewerbe",
] as const;

const schema = z.object({
  typ: z.enum(TYP_TUPLE),
  firma: z.string().min(1, "Dieses Feld ist erforderlich"),
  ansprechpartner: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  anzahlGebaeude: z.coerce.number().int().min(0).optional(),
  wohneinheitenGesamt: z.coerce.number().int().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

function resolveTyp(value: string | null): FormData["typ"] {
  return value && KONTO_TYP_VALUES.includes(value)
    ? (value as FormData["typ"])
    : "hausverwaltung";
}

export default function ImmobilienKundeOnboarding() {
  const [, setLocation] = useLocation();
  const rawSearch = useSearch();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: existing } = useGetMyImmobilienKunde();
  const upsert = useUpsertMyImmobilienKunde();

  const initialTyp = resolveTyp(new URLSearchParams(rawSearch).get("typ"));

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      typ: initialTyp,
      firma: "",
      ansprechpartner: "",
      telefon: "",
      email: "",
      anzahlGebaeude: undefined,
      wohneinheitenGesamt: undefined,
    },
  });

  useEffect(() => {
    if (existing) {
      form.reset({
        typ: resolveTyp(existing.typ),
        firma: existing.firma,
        ansprechpartner: existing.ansprechpartner ?? "",
        telefon: existing.telefon ?? "",
        email: existing.email ?? "",
        anzahlGebaeude: existing.anzahlGebaeude ?? undefined,
        wohneinheitenGesamt: existing.wohneinheitenGesamt ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const watchedTyp = form.watch("typ");
  const isPrivat = watchedTyp === "privat";

  async function onSubmit(values: FormData) {
    try {
      await upsert.mutateAsync({
        data: {
          typ: values.typ,
          firma: values.firma,
          ansprechpartner: values.ansprechpartner?.trim() || null,
          telefon: values.telefon?.trim() || null,
          email: values.email?.trim() || null,
          anzahlGebaeude:
            isCommercialTyp(values.typ) &&
            values.anzahlGebaeude !== undefined &&
            !Number.isNaN(values.anzahlGebaeude)
              ? values.anzahlGebaeude
              : null,
          wohneinheitenGesamt:
            isCommercialTyp(values.typ) &&
            values.wohneinheitenGesamt !== undefined &&
            !Number.isNaN(values.wohneinheitenGesamt)
              ? values.wohneinheitenGesamt
              : null,
        },
      });
      qc.invalidateQueries({ queryKey: getGetMyImmobilienKundeQueryKey() });
      toast({ title: "Gespeichert", description: "Ihr Kundenprofil wurde aktualisiert." });
      setLocation(isCommercialTyp(values.typ) ? "/gebaeudecheck" : "/search");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Profil konnte nicht gespeichert werden.";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isPrivat ? "Privatkonto einrichten" : "Gewerbliches Kundenprofil"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isPrivat
              ? "Vervollständigen Sie Ihr Konto, um Berater zu buchen."
              : "Hinterlegen Sie Ihr Profil für Buchungen und den Gebäudecheck. Portfolio-Angaben sind optional."}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Ihr Kundenprofil</CardTitle>
            <CardDescription>Pflichtfelder sind mit * markiert.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="typ" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kontotyp *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-typ">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {KONTO_TYPEN.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="firma" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isPrivat ? "Ihr Name *" : "Firma *"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isPrivat ? "z.B. Maria Schmidt" : "z.B. Muster Hausverwaltung GmbH"}
                        {...field}
                        data-testid="input-firma"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="ansprechpartner" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ansprechpartner (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Maria Schmidt" {...field} data-testid="input-ansprechpartner" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="telefon" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 30 12345678" {...field} data-testid="input-telefon" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="kontakt@firma.de" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {!isPrivat && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Portfolio (optional)</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Diese Angaben helfen uns, den Gebäudecheck auf Ihr Portfolio abzustimmen.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="anzahlGebaeude" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anzahl Gebäude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="z.B. 25"
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-anzahlGebaeude"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="wohneinheitenGesamt" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wohneinheiten gesamt</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="z.B. 480"
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-wohneinheitenGesamt"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={upsert.isPending} data-testid="button-submit-immobilien">
                  {upsert.isPending ? "Wird gespeichert..." : existing ? "Profil aktualisieren" : "Profil erstellen"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8">
          <DeleteAccountSection variant="Kundenkonto" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
