import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  useGetMyVerwalter,
  useCreateMyVerwalter,
  getGetMyVerwalterQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2 } from "lucide-react";
import {
  VERWALTER_TYPEN,
  VERWALTER_TYP_LABELS,
  PROVISIONSMODELL_LABELS,
  type VerwalterTyp,
  type Provisionsmodell,
} from "@workspace/energie-wechsel";

const PROVISIONSMODELLE: Provisionsmodell[] = ["saas_flat", "erfolgsprovision", "hybrid"];

const schema = z.object({
  firma: z.string().min(2, "Mindestens 2 Zeichen"),
  typ: z.enum(VERWALTER_TYPEN as unknown as [VerwalterTyp, ...VerwalterTyp[]]),
  handelsregisterNr: z.string().optional(),
  ustId: z.string().optional(),
  erlaubnis34c: z.boolean().default(false),
  strasse: z.string().optional(),
  plz: z.string().optional(),
  ort: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  telefon: z.string().optional(),
  provisionsmodell: z.enum(
    PROVISIONSMODELLE as unknown as [Provisionsmodell, ...Provisionsmodell[]],
  ),
});

type FormData = z.infer<typeof schema>;

export default function EnergieOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: verwalter, isLoading } = useGetMyVerwalter({
    query: { queryKey: getGetMyVerwalterQueryKey() },
  });
  const createVerwalter = useCreateMyVerwalter();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firma: "",
      typ: "hausverwaltung",
      handelsregisterNr: "",
      ustId: "",
      erlaubnis34c: false,
      strasse: "",
      plz: "",
      ort: "",
      email: "",
      telefon: "",
      provisionsmodell: "hybrid",
    },
  });

  useEffect(() => {
    if (verwalter) setLocation("/portfolio");
  }, [verwalter, setLocation]);

  async function onSubmit(values: FormData) {
    try {
      await createVerwalter.mutateAsync({
        data: {
          ...values,
          email: values.email || null,
        },
      });
      qc.invalidateQueries({ queryKey: getGetMyVerwalterQueryKey() });
      toast({ title: "Willkommen bei WattWechsel!", description: "Ihr Konto wurde angelegt." });
      setLocation("/portfolio");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Konto konnte nicht erstellt werden.";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--klard-green-l)] mb-4">
            <Zap className="h-7 w-7 text-[var(--klard-green)]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">WattWechsel einrichten</h1>
          <p className="text-muted-foreground mt-2">
            Legen Sie Ihr Verwalter-Konto an, um Ihr Energieportfolio zu verwalten.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Ihre Organisation</CardTitle>
            <CardDescription>Pflichtfelder sind mit * markiert.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="firma" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma *</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Muster Hausverwaltung GmbH" {...field} data-testid="input-firma" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="typ" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-typ">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VERWALTER_TYPEN.map((t) => (
                            <SelectItem key={t} value={t}>{VERWALTER_TYP_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="provisionsmodell" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abrechnungsmodell *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-provisionsmodell">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROVISIONSMODELLE.map((p) => (
                            <SelectItem key={p} value={p}>{PROVISIONSMODELL_LABELS[p]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="handelsregisterNr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handelsregister-Nr. (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. HRB 12345" {...field} data-testid="input-handelsregister" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="ustId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>USt-IdNr. (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. DE123456789" {...field} data-testid="input-ustid" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="strasse" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Straße (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Verwalterweg 5" {...field} data-testid="input-strasse" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="plz" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. 10115" {...field} data-testid="input-plz" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="ort" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ort (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Berlin" {...field} data-testid="input-ort" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="kontakt@firma.de" {...field} data-testid="input-email" />
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

                <FormField control={form.control} name="erlaubnis34c" render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 rounded-lg border border-border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-erlaubnis34c"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Erlaubnis nach § 34c GewO vorhanden</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Für die gewerbliche Verwaltung fremder Objekte erforderlich.
                      </p>
                    </div>
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  className="w-full bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white"
                  disabled={createVerwalter.isPending}
                  data-testid="button-submit-verwalter"
                >
                  {createVerwalter.isPending ? "Wird erstellt..." : "Konto erstellen und starten"}
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
