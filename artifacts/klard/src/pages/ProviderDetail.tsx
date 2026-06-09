import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import {
  useGetProvider, getGetProviderQueryKey,
  useListProviderServices, getListProviderServicesQueryKey,
  useListAvailability, getListAvailabilityQueryKey,
  useListProviderReviews, getListProviderReviewsQueryKey,
  useGenerateAiOffer,
  useAcceptOffer,
} from "@workspace/api-client-react";
import type { Service } from "@workspace/api-client-react";
import { Star, MapPin, Clock, CheckCircle, Globe, Phone, Sparkles, ChevronRight, Crown, Info, Briefcase, Plus, Check, FileSignature, Loader2, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { publicUrlForObjectPath } from "@/lib/upload";
import { formatPriceEUR, formatTimeBerlin, formatDateBerlin } from "@/lib/dateFmt";

const AGB_VERSION = "2026-06";

interface OfferLineItem {
  serviceId: number;
  name: string;
  durationMinutes: number;
  netPrice: number;
  vatRate: number;
  grossPrice: number;
}

function buildOfferItem(s: Service): OfferLineItem {
  const vatRate = s.vatRate ?? 19;
  const grossPrice = s.price;
  const netPrice =
    s.netPrice != null ? s.netPrice : Math.round((grossPrice / (1 + vatRate / 100)) * 100) / 100;
  return {
    serviceId: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    netPrice,
    vatRate,
    grossPrice,
  };
}

export default function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const providerId = Number(id);
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();

  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [aiInquiry, setAiInquiry] = useState("");
  const [aiResult, setAiResult] = useState<{ offer: string; estimatedPrice?: number | null; estimatedDuration?: string | null } | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Set<number>>(new Set());
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [offerAccepted, setOfferAccepted] = useState(false);

  const { data: provider, isLoading: providerLoading } = useGetProvider(providerId, {
    query: { enabled: !!providerId, queryKey: getGetProviderQueryKey(providerId) },
  });
  const { data: services = [] } = useListProviderServices(providerId, {
    query: { enabled: !!providerId, queryKey: getListProviderServicesQueryKey(providerId) },
  });
  const { data: slots = [] } = useListAvailability(providerId, {
    query: { enabled: !!providerId, queryKey: getListAvailabilityQueryKey(providerId) },
  });
  const { data: reviews = [] } = useListProviderReviews(providerId, {
    query: { enabled: !!providerId, queryKey: getListProviderReviewsQueryKey(providerId) },
  });

  const generateOffer = useGenerateAiOffer();
  const acceptOffer = useAcceptOffer();

  const availableSlots = slots.filter(s => s.isAvailable);
  const groupedSlots = availableSlots.reduce<Record<string, typeof availableSlots>>((acc, slot) => {
    const date = formatDateBerlin(slot.startTime);
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  const jsonLd = provider
    ? {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        name: provider.displayName,
        description: provider.bio ?? undefined,
        image: provider.logoUrl ? publicUrlForObjectPath(provider.logoUrl) : undefined,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        telephone: provider.phone ?? undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: provider.city,
          postalCode: provider.zip ?? undefined,
          streetAddress: provider.address ?? undefined,
          addressCountry: "DE",
        },
        aggregateRating:
          provider.reviewCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: provider.rating,
                reviewCount: provider.reviewCount,
              }
            : undefined,
      }
    : null;

  function handleBooking() {
    if (!isSignedIn) { setLocation("/sign-in"); return; }
    if (!selectedService || !selectedSlot) return;
    setLocation(`/booking/${providerId}/${selectedService}/${selectedSlot}`);
  }

  async function handleAiOffer() {
    if (!aiInquiry.trim()) return;
    const result = await generateOffer.mutateAsync({ data: { providerId, inquiry: aiInquiry } });
    setAiResult(result);
  }

  function toggleOfferService(id: number) {
    setOfferAccepted(false);
    setSelectedOffer((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const offerItems = services
    .filter((s) => selectedOffer.has(s.id))
    .map((s) => buildOfferItem(s));
  const offerTotalNet = offerItems.reduce((a, i) => a + i.netPrice, 0);
  const offerTotalGross = offerItems.reduce((a, i) => a + i.grossPrice, 0);

  async function handleAcceptOffer() {
    if (!isSignedIn) { setLocation("/sign-in"); return; }
    if (offerItems.length === 0 || !agbAccepted) return;
    await acceptOffer.mutateAsync({
      data: {
        providerId,
        inquiry: aiInquiry.trim() || null,
        offerText: aiResult?.offer ?? null,
        agbVersion: AGB_VERSION,
        items: offerItems,
      },
    });
    setOfferAccepted(true);
  }

  if (providerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <Skeleton className="h-48 rounded-2xl mb-6" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center text-muted-foreground">
          Berater nicht gefunden.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--klard-bg)] flex flex-col">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Provider Header */}
        <Card className="mb-6 rounded-[20px] border-[1.5px] shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-20 h-20 rounded-[16px] flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden border border-border bg-gradient-to-br from-[var(--klard-teal-l)] to-[var(--klard-teal-p)] text-[var(--klard-teal-d)]">
                {provider.logoUrl ? (
                  <img
                    src={publicUrlForObjectPath(provider.logoUrl)}
                    alt={`Logo ${provider.displayName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  provider.displayName.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="font-serif text-3xl font-semibold text-foreground tracking-tight">{provider.displayName}</h1>
                  {provider.verified && (
                    <span className="inline-flex items-center gap-1 bg-[var(--klard-green-l)] text-[var(--klard-green)] text-[0.7rem] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle className="h-3 w-3" /> Verifiziert
                    </span>
                  )}
                  {provider.subscriptionTier === "premium" && (
                    <span className="inline-flex items-center gap-1 bg-[var(--klard-gold-l)] text-[var(--klard-gold)] text-[0.7rem] font-bold px-2 py-0.5 rounded-full">
                      <Crown className="h-3 w-3" /> Premium
                    </span>
                  )}
                </div>
                {provider.requiresDirectBilling && (
                  <div className="mb-3 flex items-start gap-2.5 text-xs bg-gradient-to-br from-[#EFF6FF] to-[var(--klard-teal-p)] border border-[#BAE6FD] rounded-xl px-3.5 py-3">
                    <Info className="h-4 w-4 text-[var(--klard-teal-d)] mt-0.5 shrink-0" />
                    <span className="text-[var(--klard-slate)] leading-relaxed">
                      <strong className="text-[var(--klard-teal-d)]">RVG / StBVV-Hinweis:</strong> Bei dieser Berufsgruppe (Anwälte, Steuerberater, Notare) erfolgt die Abrechnung direkt mit der Kanzlei nach gesetzlichen Vorgaben. Klard übermittelt nur die Buchung.
                    </span>
                  </div>
                )}
                <p className="text-muted-foreground mb-1">{provider.category}</p>
                {provider.yearsExperience != null && provider.yearsExperience > 0 && (
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> {provider.yearsExperience} Jahre Berufserfahrung
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {provider.consultationMode && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {provider.consultationMode === "online"
                        ? "Nur Online-Beratung"
                        : provider.consultationMode === "in-person"
                          ? "Nur Vor-Ort-Beratung"
                          : "Online & Vor-Ort"}
                    </Badge>
                  )}
                  {provider.responseTime && (
                    <Badge variant="outline" className="text-xs font-normal">
                      Antwort {provider.responseTime.toLowerCase()}
                    </Badge>
                  )}
                  {(provider.certificates ?? []).map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs font-normal">{c}</Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {provider.city}{provider.address ? `, ${provider.address}` : ""}
                  </span>
                  {provider.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      {provider.phone}
                    </span>
                  )}
                  {provider.website && (
                    <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors" data-testid="link-website">
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`h-4 w-4 ${n <= Math.round(provider.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({provider.reviewCount} Bewertungen)</span>
                </div>
              </div>
            </div>

            {provider.bio && (
              <>
                <Separator className="my-5" />
                <p className="text-muted-foreground leading-relaxed">{provider.bio}</p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Services */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Leistungen</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Leistungen hinterlegt.</p>
                ) : (
                  <div className="space-y-2">
                    {services.map(service => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service.id === selectedService ? null : service.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-150 text-left ${
                          selectedService === service.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                        data-testid={`button-service-${service.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{service.name}</p>
                          {service.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{service.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {service.durationMinutes} Min.
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 ml-4 text-right">
                          <span className="font-semibold text-foreground">
                            {service.price === 0 ? "Kostenlos" : formatPriceEUR(service.price)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Branded binding offer */}
            <div className="overflow-hidden rounded-[20px] border border-[#3B0764] text-white shadow-md">
              {/* Header */}
              <div
                className="px-6 py-5"
                style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#2E1065 100%)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-[#C4B5FD]" />
                  <h3 className="font-serif text-lg font-semibold">Ihr Angebot von {provider.displayName}</h3>
                </div>
                <p className="text-sm text-[#C4B5FD]">
                  Wählen Sie die gewünschten Leistungen aus — der Preis wird sofort berechnet.
                  Optional erstellt unsere KI eine passende Bedarfsanalyse.
                </p>
              </div>

              <div className="bg-[#1E1B4B] px-6 py-5 space-y-4">
                {/* AI inquiry (optional) */}
                <div>
                  <Textarea
                    placeholder="Optional: Anliegen beschreiben für eine KI-Bedarfsanalyse …"
                    value={aiInquiry}
                    onChange={e => setAiInquiry(e.target.value)}
                    rows={2}
                    data-testid="textarea-ai-inquiry"
                    className="bg-[#312E81]/50 border-[#4C1D95] text-white placeholder:text-[#A78BFA] focus-visible:ring-[#C4B5FD]"
                  />
                  <Button
                    onClick={handleAiOffer}
                    disabled={!aiInquiry.trim() || generateOffer.isPending}
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-2 bg-transparent border-[#6D28D9] text-[#DDD6FE] hover:bg-[#312E81] hover:text-white"
                    data-testid="button-generate-offer"
                  >
                    <Sparkles className="h-4 w-4" />
                    {generateOffer.isPending ? "Wird erstellt …" : "KI-Bedarfsanalyse erstellen"}
                  </Button>
                  {aiResult && (
                    <div className="mt-3 p-3 rounded-xl bg-[#312E81]/60 border border-[#4C1D95]">
                      <p className="text-xs font-semibold text-[#C4B5FD] mb-1">KI-Bedarfsanalyse</p>
                      <p className="text-sm text-[#DDD6FE] whitespace-pre-wrap leading-relaxed">{aiResult.offer}</p>
                    </div>
                  )}
                </div>

                {/* Selectable services */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#A78BFA] mb-2">
                    Leistungen auswählen
                  </p>
                  {services.length === 0 ? (
                    <p className="text-sm text-[#A78BFA]">Dieser Berater hat noch keine Leistungen hinterlegt.</p>
                  ) : (
                    <div className="space-y-2">
                      {services.map((s) => {
                        const active = selectedOffer.has(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleOfferService(s.id)}
                            className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                              active
                                ? "border-[#C4B5FD] bg-[#312E81]"
                                : "border-[#4C1D95] bg-[#312E81]/30 hover:bg-[#312E81]/60"
                            }`}
                            data-testid={`offer-service-${s.id}`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                active ? "bg-[#C4B5FD] border-[#C4B5FD] text-[#2E1065]" : "border-[#6D28D9]"
                              }`}
                            >
                              {active ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-[#A78BFA]" />}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-white truncate">{s.name}</span>
                              <span className="block text-xs text-[#A78BFA] flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {s.durationMinutes} Min.
                              </span>
                            </span>
                            <span className="shrink-0 text-right font-semibold text-white">
                              {s.price === 0 ? "Kostenlos" : formatPriceEUR(s.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Running total */}
                {offerItems.length > 0 && (
                  <div className="rounded-xl bg-white text-foreground p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Ihr verbindliches Angebot
                    </p>
                    <ul className="space-y-1.5 mb-3">
                      {offerItems.map((it) => (
                        <li key={it.serviceId} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{it.name}</span>
                          <span className="font-medium">{formatPriceEUR(it.grossPrice)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-border pt-2 space-y-0.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Netto</span>
                        <span>{formatPriceEUR(offerTotalNet)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>zzgl. USt.</span>
                        <span>{formatPriceEUR(offerTotalGross - offerTotalNet)}</span>
                      </div>
                      <div className="flex items-center justify-between text-base font-semibold text-foreground pt-1">
                        <span>Gesamt (brutto)</span>
                        <span data-testid="offer-total">{formatPriceEUR(offerTotalGross)}</span>
                      </div>
                    </div>

                    {offerAccepted ? (
                      <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900 flex items-start gap-2" data-testid="offer-accepted-confirmation">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          Angebot verbindlich angenommen. {provider.displayName} wurde
                          informiert und meldet sich zur Terminvereinbarung. Eine Übersicht
                          finden Sie unter „Meine Angebote".
                        </span>
                      </div>
                    ) : (
                      <>
                        <label className="mt-4 flex items-start gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={agbAccepted}
                            onChange={(e) => setAgbAccepted(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            data-testid="checkbox-agb"
                          />
                          <span className="text-xs text-muted-foreground leading-relaxed">
                            Ich nehme das Angebot verbindlich an und akzeptiere die{" "}
                            <Link href="/agb" className="underline font-medium text-foreground">
                              Allgemeinen Geschäftsbedingungen
                            </Link>
                            . Es kommt ein kostenpflichtiger Vertrag zustande.
                          </span>
                        </label>
                        <Button
                          onClick={handleAcceptOffer}
                          disabled={!agbAccepted || acceptOffer.isPending}
                          className="mt-3 w-full gap-2 font-bold"
                          data-testid="button-accept-offer"
                        >
                          {acceptOffer.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileSignature className="h-4 w-4" />
                          )}
                          {isSignedIn ? "Angebot verbindlich annehmen" : "Anmelden & annehmen"}
                        </Button>
                        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                          <ShieldCheck className="h-3 w-3" />
                          Rechtsverbindliche Annahme · Festpreise inkl. gesetzlicher USt.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bewertungen ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Noch keine Bewertungen.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="pb-4 border-b border-border last:border-0 last:pb-0" data-testid={`review-${review.id}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{review.customerName ?? "Anonym"}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} className={`h-3 w-3 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.createdAt).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Termin buchen</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {!selectedService ? (
                  <p className="text-sm text-muted-foreground">Wahlen Sie zunachst eine Leistung aus.</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {Object.entries(groupedSlots).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Keine freien Termine verfugbar.</p>
                      ) : (
                        Object.entries(groupedSlots).map(([date, dateSlots]) => (
                          <div key={date}>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{date}</p>
                            <div className="flex flex-wrap gap-2">
                              {dateSlots.map(slot => (
                                <button
                                  key={slot.id}
                                  onClick={() => setSelectedSlot(slot.id === selectedSlot ? null : slot.id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[0.78rem] font-semibold border-[1.5px] transition-all ${
                                    selectedSlot === slot.id
                                      ? "border-[var(--klard-teal-d)] bg-primary text-primary-foreground"
                                      : "border-[var(--klard-teal-p)] bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)] hover:bg-primary hover:text-white hover:border-primary"
                                  }`}
                                  data-testid={`button-slot-${slot.id}`}
                                >
                                  {formatTimeBerlin(slot.startTime)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Button
                      className="w-full gap-2"
                      disabled={!selectedSlot}
                      onClick={handleBooking}
                      data-testid="button-book"
                    >
                      Weiter zur Buchung <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
