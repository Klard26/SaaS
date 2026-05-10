import { useState } from "react";
import { useParams, useLocation } from "wouter";
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
} from "@workspace/api-client-react";
import { Star, MapPin, Clock, CheckCircle, Globe, Phone, Sparkles, ChevronRight, Crown, Info } from "lucide-react";

export default function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const providerId = Number(id);
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();

  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [aiInquiry, setAiInquiry] = useState("");
  const [aiResult, setAiResult] = useState<{ offer: string; estimatedPrice?: number | null; estimatedDuration?: string | null } | null>(null);

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

  const availableSlots = slots.filter(s => s.isAvailable);
  const groupedSlots = availableSlots.reduce<Record<string, typeof availableSlots>>((acc, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

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
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Provider Header */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                {provider.displayName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{provider.displayName}</h1>
                  {provider.subscriptionTier === "premium" && (
                    <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                      <Crown className="h-3.5 w-3.5" /> Premium
                    </Badge>
                  )}
                  {provider.verified && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Verifiziert
                    </Badge>
                  )}
                </div>
                {provider.requiresDirectBilling && (
                  <div className="mb-3 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md px-3 py-2">
                    <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span className="text-amber-900 dark:text-amber-200">
                      Hinweis: Bei dieser Berufsgruppe (Anwälte, Steuerberater, Notare) erfolgt die Abrechnung direkt mit der Kanzlei nach gesetzlichen Vorgaben (RVG/StBVV). Klard übermittelt nur die Buchung.
                    </span>
                  </div>
                )}
                <p className="text-muted-foreground mb-3">{provider.category}</p>

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
                            {service.price === 0 ? "Kostenlos" : `${service.price} €`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Offer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  KI-Angebot anfragen
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Beschreiben Sie Ihr Anliegen — unsere KI erstellt ein individuelles Angebot.
                </p>
                <Textarea
                  placeholder="z.B. Ich bin Selbstandiger und benotige Hilfe bei meiner Steuererklarung fur 2024 ..."
                  value={aiInquiry}
                  onChange={e => setAiInquiry(e.target.value)}
                  rows={3}
                  data-testid="textarea-ai-inquiry"
                />
                <Button
                  onClick={handleAiOffer}
                  disabled={!aiInquiry.trim() || generateOffer.isPending}
                  className="gap-2"
                  data-testid="button-generate-offer"
                >
                  <Sparkles className="h-4 w-4" />
                  {generateOffer.isPending ? "Wird erstellt..." : "Angebot generieren"}
                </Button>

                {aiResult && (
                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-foreground mb-2">Ihr personliches Angebot:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiResult.offer}</p>
                    {(aiResult.estimatedPrice || aiResult.estimatedDuration) && (
                      <div className="flex gap-4 mt-3 pt-3 border-t border-primary/20">
                        {aiResult.estimatedPrice && (
                          <div>
                            <p className="text-xs text-muted-foreground">Geschatzter Preis</p>
                            <p className="font-semibold text-foreground">{aiResult.estimatedPrice} €</p>
                          </div>
                        )}
                        {aiResult.estimatedDuration && (
                          <div>
                            <p className="text-xs text-muted-foreground">Geschatzte Dauer</p>
                            <p className="font-semibold text-foreground">{aiResult.estimatedDuration}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

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
                                  className={`px-3 py-1.5 rounded-md text-sm border transition-all ${
                                    selectedSlot === slot.id
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:border-primary/40"
                                  }`}
                                  data-testid={`button-slot-${slot.id}`}
                                >
                                  {new Date(slot.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
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
    </div>
  );
}
