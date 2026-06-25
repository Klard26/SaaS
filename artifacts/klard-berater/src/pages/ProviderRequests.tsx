import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyProviderProfile,
  useListProviderRequests,
  useGetProviderRequest,
  useCreateProviderOffer,
  useGetMyWallet,
  useRefundLead,
  getListProviderRequestsQueryKey,
  getGetProviderRequestQueryKey,
  getGetMyWalletQueryKey,
} from "@workspace/api-client-react";
import type { RfqRequestForProvider } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/journey/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { useListCategories } from "@workspace/api-client-react";
import {
  Inbox,
  Loader2,
  MapPin,
  Wallet,
  Mail,
  Phone,
  User,
  AlertCircle,
} from "lucide-react";

const eur = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const URGENCY_LABELS: Record<string, string> = {
  sofort: "Sofort",
  zwei_wochen: "In 2 Wochen",
  flexibel: "Flexibel",
};

const PRICE_TYPE_TUPLE = ["fixed", "hourly", "estimate"] as const;
const PRICE_TYPE_LABELS: Record<(typeof PRICE_TYPE_TUPLE)[number], string> = {
  fixed: "Festpreis",
  hourly: "Stundensatz",
  estimate: "Kostenschätzung",
};

const offerSchema = z.object({
  priceEur: z.coerce.number().min(0, "Bitte geben Sie einen Preis an"),
  priceType: z.enum(PRICE_TYPE_TUPLE),
  message: z.string().optional(),
  availableFrom: z.string().optional(),
  estimatedDuration: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

export default function ProviderRequests() {
  const { data: profile, isLoading: profileLoading } = useGetMyProviderProfile();
  const providerReady = !!profile;

  const { data: categories = [] } = useListCategories();
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.slug, c.name]));
    return (slug: string) => map.get(slug) ?? slug;
  }, [categories]);

  const listQuery = useListProviderRequests({
    query: { enabled: providerReady, queryKey: getListProviderRequestsQueryKey() },
  });
  const walletQuery = useGetMyWallet({ query: { enabled: providerReady, queryKey: getGetMyWalletQueryKey() } });
  const balanceCents = walletQuery.data?.balanceCents ?? 0;
  const freeLeadsRemaining = walletQuery.data?.entitlements.freeLeadsRemaining ?? 0;

  const [selected, setSelected] = useState<RfqRequestForProvider | null>(null);

  const requests = listQuery.data ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--klard-bg)]">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Anfragen</h1>
            <p className="text-muted-foreground mt-1">
              Passende Kundenanfragen. Senden Sie ein Angebot, um die Kontaktdaten freizuschalten.
            </p>
          </div>
          <Link href="/wallet">
            <Button variant="outline" size="sm" data-testid="link-wallet">
              <Wallet className="mr-2 h-4 w-4" />
              {eur(balanceCents)}
            </Button>
          </Link>
        </div>

        {!providerReady ? (
          profileLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Profil erforderlich"
              description="Legen Sie zuerst Ihr Berater-Profil an, um Anfragen zu erhalten."
            >
              <Link href="/provider/onboarding">
                <Button data-testid="button-onboarding">Profil erstellen</Button>
              </Link>
            </EmptyState>
          )
        ) : listQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Noch keine passenden Anfragen"
            description="Sobald Kunden in Ihrer Kategorie und Region eine Anfrage stellen, erscheint sie hier."
          />
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <Card key={r.id} data-testid={`card-request-${r.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{r.title}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{categoryName(r.categorySlug)}</span>
                        {r.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {r.postalCode ? `${r.postalCode} ` : ""}
                            {r.city}
                          </span>
                        )}
                        <Badge variant="outline">{URGENCY_LABELS[r.urgency] ?? r.urgency}</Badge>
                        {r.fundingRelevant && <Badge variant="secondary">Förderung</Badge>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {r.hasOffered ? (
                        <Badge variant="default">Angebot gesendet</Badge>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Lead-Gebühr
                          <div className="text-sm font-semibold text-foreground">
                            {eur(r.estimatedLeadPriceCents)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {r.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {r.offerCount} Angebot(e) bisher
                    </span>
                    <Button
                      size="sm"
                      variant={r.hasOffered ? "outline" : "default"}
                      onClick={() => setSelected(r)}
                      data-testid={`button-open-request-${r.id}`}
                    >
                      {r.hasOffered ? "Details" : "Angebot senden"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <RequestDialog
        request={selected}
        balanceCents={balanceCents}
        freeLeadsRemaining={freeLeadsRemaining}
        categoryName={categoryName}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function RequestDialog({
  request,
  balanceCents,
  freeLeadsRemaining,
  categoryName,
  onClose,
}: {
  request: RfqRequestForProvider | null;
  balanceCents: number;
  freeLeadsRemaining: number;
  categoryName: (slug: string) => string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const requestId = request?.id ?? 0;

  const detailQuery = useGetProviderRequest(requestId, {
    query: { enabled: !!request, queryKey: getGetProviderRequestQueryKey(requestId) },
  });
  const detail = detailQuery.data ?? request;

  const createOffer = useCreateProviderOffer();
  const refundLead = useRefundLead();

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: { priceEur: 0, priceType: "fixed", message: "", availableFrom: "", estimatedDuration: "" },
  });

  const estimatedLead = detail?.estimatedLeadPriceCents ?? 0;
  const insufficient = balanceCents < estimatedLead;
  const hasOffered = detail?.hasOffered ?? false;

  async function onSubmit(values: OfferFormData) {
    if (!request) return;
    try {
      const result = await createOffer.mutateAsync({
        requestId: request.id,
        data: {
          priceCents: Math.round(values.priceEur * 100),
          priceType: values.priceType,
          message: values.message?.trim() || null,
          availableFrom: values.availableFrom?.trim() || null,
          estimatedDuration: values.estimatedDuration?.trim() || null,
        },
      });
      toast({
        title: "Angebot gesendet",
        description: result.freeLeadUsed
          ? `Kostenloser Lead eingelöst – keine Gebühr. Noch ${result.freeLeadsRemaining} kostenlose Lead(s) übrig.`
          : `Lead-Gebühr ${eur(result.leadFeeCents)} abgebucht. Neues Guthaben: ${eur(
              result.walletBalanceCents,
            )}.`,
      });
      qc.invalidateQueries({ queryKey: getListProviderRequestsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetProviderRequestQueryKey(request.id) });
      qc.invalidateQueries({ queryKey: getGetMyWalletQueryKey() });
      form.reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/INSUFFICIENT_FUNDS|guthaben/i.test(msg)) {
        toast({
          title: "Guthaben zu niedrig",
          description: "Bitte laden Sie Ihr Lead-Guthaben auf, um ein Angebot zu senden.",
          variant: "destructive",
        });
      } else if (/LEAD_LIMIT|limit/i.test(msg)) {
        toast({
          title: "Monatslimit erreicht",
          description: "Sie haben Ihr monatliches Lead-Kontingent ausgeschöpft. Upgrade auf Premium für unbegrenzte Leads.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fehler",
          description: "Das Angebot konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
      }
    }
  }

  async function handleRefund() {
    if (!request?.leadFeeId) return;
    try {
      const result = await refundLead.mutateAsync({
        leadFeeId: request.leadFeeId,
        data: { reason: "Lead unbrauchbar (Lead-Garantie)" },
      });
      toast({
        title: "Erstattung gutgeschrieben",
        description: `${eur(result.refundedCents)} zurück auf Ihr Guthaben. Neuer Stand: ${eur(
          result.balanceCents,
        )}.`,
      });
      qc.invalidateQueries({ queryKey: getGetMyWalletQueryKey() });
      qc.invalidateQueries({ queryKey: getGetProviderRequestQueryKey(request.id) });
    } catch {
      toast({
        title: "Erstattung nicht möglich",
        description: "Diese Lead-Gebühr wurde bereits erstattet oder ist nicht erstattungsfähig.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {detail && (
          <>
            <DialogHeader>
              <DialogTitle>{detail.title}</DialogTitle>
              <DialogDescription>
                {categoryName(detail.categorySlug)} · {URGENCY_LABELS[detail.urgency] ?? detail.urgency}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {detail.description && (
                <p className="text-sm text-foreground whitespace-pre-wrap">{detail.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {(detail.city || detail.postalCode) && (
                  <div>
                    <span className="text-muted-foreground">Region</span>
                    <p className="text-foreground">
                      {detail.postalCode ? `${detail.postalCode} ` : ""}
                      {detail.city}
                    </p>
                  </div>
                )}
                {(detail.budgetMinCents != null || detail.budgetMaxCents != null) && (
                  <div>
                    <span className="text-muted-foreground">Budget</span>
                    <p className="text-foreground">
                      {detail.budgetMinCents != null ? eur(detail.budgetMinCents) : "–"}
                      {" – "}
                      {detail.budgetMaxCents != null ? eur(detail.budgetMaxCents) : "–"}
                    </p>
                  </div>
                )}
              </div>

              {detail.contactUnlocked ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                  <p className="text-xs font-medium text-primary">Kontaktdaten (freigeschaltet)</p>
                  {detail.customerName && (
                    <p className="text-sm inline-flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {detail.customerName}
                    </p>
                  )}
                  {detail.customerEmail && (
                    <p className="text-sm inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a className="text-primary hover:underline" href={`mailto:${detail.customerEmail}`}>
                        {detail.customerEmail}
                      </a>
                    </p>
                  )}
                  {detail.customerPhone && (
                    <p className="text-sm inline-flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a className="text-primary hover:underline" href={`tel:${detail.customerPhone}`}>
                        {detail.customerPhone}
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  Die Kontaktdaten des Kunden werden freigeschaltet, sobald Sie ein Angebot senden.
                </div>
              )}

              <Separator />

              {hasOffered ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Sie haben für diese Anfrage bereits ein Angebot gesendet.
                  </p>
                  {request?.leadFeeId && (
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        Lead-Garantie
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        War dieser Lead unbrauchbar (z. B. falsche Kontaktdaten, kein echtes Anliegen)?
                        Sie können die Lead-Gebühr einmalig erstatten lassen.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={handleRefund}
                        disabled={refundLead.isPending}
                        data-testid="button-refund-lead"
                      >
                        {refundLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lead reklamieren
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {freeLeadsRemaining > 0 ? (
                      <div className="rounded-lg border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Lead-Gebühr für dieses Angebot</span>
                          <span className="font-semibold text-foreground">
                            <span className="text-muted-foreground line-through mr-1.5">{eur(estimatedLead)}</span>
                            kostenlos
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground" data-testid="text-free-lead-note">
                          Dieses Angebot wird mit einem Ihrer {freeLeadsRemaining} kostenlosen Leads
                          verrechnet – Ihr Guthaben bleibt unberührt.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Lead-Gebühr für dieses Angebot</span>
                        <span className="font-semibold text-foreground">{eur(estimatedLead)}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="priceEur"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ihr Preis (€)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                data-testid="input-offer-price"
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
                        name="priceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preisart</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-offer-pricetype">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PRICE_TYPE_TUPLE.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {PRICE_TYPE_LABELS[t]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nachricht (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Stellen Sie sich kurz vor und beschreiben Sie Ihr Angebot."
                              data-testid="input-offer-message"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="availableFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verfügbar ab (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="z. B. nächste Woche"
                                data-testid="input-offer-availablefrom"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="estimatedDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dauer (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="z. B. 2-3 Stunden"
                                data-testid="input-offer-duration"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {insufficient ? (
                      <div className="space-y-2">
                        <p className="text-sm text-destructive">
                          Ihr Guthaben ({eur(balanceCents)}) reicht nicht für die Lead-Gebühr.
                        </p>
                        <Link href="/wallet">
                          <Button type="button" variant="outline" className="w-full" data-testid="button-topup-cta">
                            <Wallet className="mr-2 h-4 w-4" />
                            Guthaben aufladen
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createOffer.isPending}
                        data-testid="button-submit-offer"
                      >
                        {createOffer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Angebot senden ({eur(estimatedLead)} Lead-Gebühr)
                      </Button>
                    )}
                  </form>
                </Form>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
