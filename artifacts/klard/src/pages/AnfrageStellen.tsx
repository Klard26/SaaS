import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GuidedHeader } from "@/components/journey/GuidedHeader";
import { useCreateRequest, useListCategories } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2 } from "lucide-react";

const URGENCY_TUPLE = ["sofort", "zwei_wochen", "flexibel"] as const;

const URGENCY_LABELS: Record<(typeof URGENCY_TUPLE)[number], string> = {
  sofort: "So schnell wie möglich",
  zwei_wochen: "Innerhalb von 2 Wochen",
  flexibel: "Ich bin flexibel",
};

const schema = z
  .object({
    customerName: z.string().min(1, "Bitte geben Sie Ihren Namen an"),
    customerEmail: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse an"),
    customerPhone: z.string().optional(),
    categorySlug: z.string().min(1, "Bitte wählen Sie eine Kategorie"),
    title: z.string().min(1, "Bitte beschreiben Sie Ihr Anliegen kurz").max(200),
    description: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    budgetMinEur: z.coerce.number().int().min(0).optional(),
    budgetMaxEur: z.coerce.number().int().min(0).optional(),
    urgency: z.enum(URGENCY_TUPLE),
    fundingRelevant: z.boolean(),
    consentDataShare: z.boolean().refine((v) => v === true, {
      message: "Ihre Einwilligung ist erforderlich, damit wir Berater anfragen dürfen.",
    }),
  })
  .refine(
    (d) =>
      d.budgetMinEur == null ||
      d.budgetMaxEur == null ||
      d.budgetMaxEur >= d.budgetMinEur,
    { message: "Das Maximalbudget muss größer als das Minimum sein.", path: ["budgetMaxEur"] },
  );

type FormData = z.infer<typeof schema>;

const toCents = (eur?: number | null) =>
  eur == null || Number.isNaN(eur) ? null : Math.round(eur * 100);

export default function AnfrageStellen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories = [] } = useListCategories();
  const createRequest = useCreateRequest();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      categorySlug: "",
      title: "",
      description: "",
      postalCode: "",
      city: "",
      urgency: "flexibel",
      fundingRelevant: false,
      consentDataShare: false,
    },
  });

  async function onSubmit(values: FormData) {
    try {
      const result = await createRequest.mutateAsync({
        data: {
          customerName: values.customerName.trim(),
          customerEmail: values.customerEmail.trim(),
          customerPhone: values.customerPhone?.trim() || null,
          categorySlug: values.categorySlug,
          title: values.title.trim(),
          description: values.description?.trim() || null,
          postalCode: values.postalCode?.trim() || null,
          city: values.city?.trim() || null,
          budgetMinCents: toCents(values.budgetMinEur),
          budgetMaxCents: toCents(values.budgetMaxEur),
          urgency: values.urgency,
          fundingRelevant: values.fundingRelevant,
          consentDataShare: true,
        },
      });

      toast({
        title: "Anfrage gesendet",
        description:
          result.matchedProviders > 0
            ? `${result.matchedProviders} passende Berater wurden benachrichtigt. Sie erhalten Angebote per E-Mail.`
            : "Ihre Anfrage ist eingegangen. Passende Berater werden benachrichtigt, sobald sie verfügbar sind.",
      });

      setLocation(
        `/meine-anfragen?request=${result.request.id}&token=${encodeURIComponent(result.accessToken)}`,
      );
    } catch {
      toast({
        title: "Fehler",
        description: "Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
        <GuidedHeader
          icon={FileText}
          title="Anfrage stellen – kostenlos & unverbindlich"
          subtitle="Beschreiben Sie Ihr Anliegen einmal. Passende Berater melden sich mit konkreten Angeboten. Kein Konto nötig."
          steps={["Anliegen", "Angebote erhalten", "Berater wählen"]}
          current={0}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground">Ihr Anliegen</h2>

                <FormField
                  control={form.control}
                  name="categorySlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-anfrage-category">
                            <SelectValue placeholder="Bitte wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.slug}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Worum geht es?</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z. B. Steuererklärung 2025 für Selbstständige"
                          data-testid="input-anfrage-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Beschreiben Sie Ihr Anliegen genauer, damit Berater ein passendes Angebot erstellen können."
                          data-testid="input-anfrage-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PLZ (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="10115" data-testid="input-anfrage-plz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ort (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Berlin" data-testid="input-anfrage-city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budgetMinEur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget von (€, optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            data-testid="input-anfrage-budget-min"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budgetMaxEur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget bis (€, optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="1000"
                            data-testid="input-anfrage-budget-max"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zeitrahmen</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-anfrage-urgency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {URGENCY_TUPLE.map((u) => (
                            <SelectItem key={u} value={u}>
                              {URGENCY_LABELS[u]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fundingRelevant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border border-border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-anfrage-funding"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-snug">
                        <FormLabel className="font-medium">Förderung ist relevant</FormLabel>
                        <FormDescription>
                          Aktivieren, wenn es um Fördermittel oder förderfähige Maßnahmen geht.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-5">
                <h2 className="text-base font-semibold text-foreground">Ihre Kontaktdaten</h2>
                <p className="text-sm text-muted-foreground">
                  Ihre Kontaktdaten werden erst dann an einen Berater weitergegeben, wenn dieser Ihnen
                  ein konkretes Angebot macht.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Max Mustermann"
                            data-testid="input-anfrage-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+49 ..."
                            data-testid="input-anfrage-phone"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="max@beispiel.de"
                          data-testid="input-anfrage-email"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        An diese Adresse senden wir Ihren Zugangslink und neue Angebote.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consentDataShare"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border border-border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-anfrage-consent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-snug">
                        <FormLabel className="font-medium">Einwilligung zur Weitergabe</FormLabel>
                        <FormDescription>
                          Ich willige ein, dass Klard meine Anfrage an passende Berater übermittelt.
                          Meine Kontaktdaten werden erst sichtbar, wenn ein Berater mir ein Angebot
                          macht. Die Einwilligung ist freiwillig und jederzeit widerrufbar.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={createRequest.isPending}
              data-testid="button-anfrage-submit"
            >
              {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anfrage kostenlos senden
            </Button>
          </form>
        </Form>
      </main>
      <Footer />
    </div>
  );
}
