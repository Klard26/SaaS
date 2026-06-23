import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useUser } from "@clerk/react";
import {
  useListMyRequests,
  useAccessRequest,
  useAcceptRequestOffer,
  getListMyRequestsQueryKey,
} from "@workspace/api-client-react";
import type { RequestWithOffers, RfqOfferWithProvider } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/journey/EmptyState";
import { VerifiedBadge, PremiumBadge } from "@/components/journey/Badges";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Star,
  MapPin,
  CalendarClock,
} from "lucide-react";

const eur = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const REQUEST_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  open: { label: "Offen", variant: "secondary" },
  matched: { label: "Angebote erhalten", variant: "default" },
  fulfilled: { label: "Berater gewählt", variant: "outline" },
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: "Festpreis",
  hourly: "pro Stunde",
  estimate: "Schätzung",
};

const OFFER_STATUS: Record<string, string> = {
  sent: "Neu",
  viewed: "Angesehen",
  accepted: "Angenommen",
  declined: "Abgelehnt",
};

function useQueryParams() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const requestRaw = params.get("request");
  const requestId = requestRaw ? Number(requestRaw) : null;
  const token = params.get("token");
  return {
    requestId: requestId && !Number.isNaN(requestId) ? requestId : null,
    token: token || null,
  };
}

function OfferCard({
  offer,
  canAccept,
  onAccept,
  accepting,
}: {
  offer: RfqOfferWithProvider;
  canAccept: boolean;
  onAccept: () => void;
  accepting: boolean;
}) {
  const isAccepted = offer.status === "accepted";
  return (
    <Card
      className={isAccepted ? "border-primary ring-1 ring-primary/30" : undefined}
      data-testid={`card-offer-${offer.id}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{offer.provider.displayName}</span>
              {offer.provider.verified && <VerifiedBadge size="sm" />}
              {offer.provider.subscriptionTier === "premium" && <PremiumBadge size="sm" />}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {(offer.provider.rating ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {(offer.provider.rating ?? 0).toFixed(1)}
                  {(offer.provider.reviewCount ?? 0) > 0 && ` (${offer.provider.reviewCount})`}
                </span>
              )}
              {offer.provider.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {offer.provider.city}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-foreground">{eur(offer.priceCents)}</div>
            <div className="text-xs text-muted-foreground">
              {PRICE_TYPE_LABELS[offer.priceType] ?? offer.priceType}
            </div>
          </div>
        </div>

        {offer.message && (
          <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">{offer.message}</p>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {offer.availableFrom && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              Verfügbar ab {offer.availableFrom}
            </span>
          )}
          {offer.estimatedDuration && <span>Dauer: {offer.estimatedDuration}</span>}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Badge variant={isAccepted ? "default" : "secondary"}>
            {OFFER_STATUS[offer.status] ?? offer.status}
          </Badge>
          {isAccepted ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Angenommen
            </span>
          ) : canAccept ? (
            <Button
              size="sm"
              onClick={onAccept}
              disabled={accepting}
              data-testid={`button-accept-offer-${offer.id}`}
            >
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Angebot annehmen
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MeineAnfragen() {
  const { requestId, token } = useQueryParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSignedIn } = useUser();

  const [detail, setDetail] = useState<RequestWithOffers | null>(null);
  const [detailError, setDetailError] = useState(false);

  const access = useAccessRequest();
  const acceptOffer = useAcceptRequestOffer();

  const listQuery = useListMyRequests({
    query: { enabled: !!isSignedIn && !requestId, queryKey: getListMyRequestsQueryKey() },
  });

  const loadDetail = useCallback(
    async (rid: number, tok: string | null) => {
      setDetailError(false);
      try {
        const res = await access.mutateAsync({ data: { requestId: rid, token: tok } });
        setDetail(res);
      } catch {
        setDetailError(true);
        setDetail(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (requestId) {
      loadDetail(requestId, token);
    } else {
      setDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, token]);

  async function handleAccept(offerId: number) {
    if (!requestId) return;
    try {
      await acceptOffer.mutateAsync({ id: offerId, data: { token } });
      toast({
        title: "Angebot angenommen",
        description: "Der Berater wurde informiert und meldet sich bei Ihnen.",
      });
      await loadDetail(requestId, token);
    } catch {
      toast({
        title: "Fehler",
        description: "Das Angebot konnte nicht angenommen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  }

  const showDetail = !!requestId;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
        {showDetail ? (
          <DetailView
            detail={detail}
            loading={access.isPending && !detail}
            error={detailError}
            onBack={isSignedIn ? () => setLocation("/meine-anfragen") : undefined}
            onAccept={handleAccept}
            accepting={acceptOffer.isPending}
            acceptingOfferId={acceptOffer.variables?.id ?? null}
          />
        ) : (
          <ListView
            isSignedIn={!!isSignedIn}
            loading={listQuery.isLoading}
            requests={listQuery.data ?? []}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function DetailView({
  detail,
  loading,
  error,
  onBack,
  onAccept,
  accepting,
  acceptingOfferId,
}: {
  detail: RequestWithOffers | null;
  loading: boolean;
  error: boolean;
  onBack?: () => void;
  onAccept: (offerId: number) => void;
  accepting: boolean;
  acceptingOfferId: number | null;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <EmptyState
        icon={FileText}
        title="Anfrage nicht gefunden"
        description="Der Zugangslink ist ungültig oder abgelaufen. Bitte öffnen Sie den Link aus Ihrer E-Mail erneut."
      >
        <Link href="/anfrage">
          <Button data-testid="button-new-request">Neue Anfrage stellen</Button>
        </Link>
      </EmptyState>
    );
  }

  const { request, offers } = detail;
  const status = REQUEST_STATUS[request.status] ?? { label: request.status, variant: "secondary" as const };
  const hasAccepted = offers.some((o) => o.status === "accepted");
  const canAccept = !hasAccepted && request.status !== "fulfilled";

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-list">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Alle Anfragen
        </Button>
      )}

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">{request.title}</h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {request.description && (
          <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{request.description}</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          {offers.length > 0 ? `${offers.length} Angebot(e)` : "Angebote"}
        </h2>
        {offers.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Noch keine Angebote"
            description="Ihre Anfrage wurde an passende Berater übermittelt. Sobald ein Berater ein Angebot macht, erscheint es hier und Sie erhalten eine E-Mail."
          />
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                canAccept={canAccept}
                onAccept={() => onAccept(offer.id)}
                accepting={accepting && acceptingOfferId === offer.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListView({
  isSignedIn,
  loading,
  requests,
}: {
  isSignedIn: boolean;
  loading: boolean;
  requests: { id: number; title: string; categorySlug: string; status: string; createdAt: string }[];
}) {
  if (!isSignedIn) {
    return (
      <EmptyState
        icon={FileText}
        title="Ihre Anfragen"
        description="Öffnen Sie den Zugangslink aus Ihrer Bestätigungs-E-Mail, um Ihre Angebote zu sehen – oder stellen Sie eine neue Anfrage."
      >
        <Link href="/anfrage">
          <Button data-testid="button-new-request">Neue Anfrage stellen</Button>
        </Link>
      </EmptyState>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Noch keine Anfragen"
        description="Sie haben noch keine Anfrage gestellt. Beschreiben Sie Ihr Anliegen und erhalten Sie passende Angebote."
      >
        <Link href="/anfrage">
          <Button data-testid="button-new-request">Anfrage stellen</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Meine Anfragen</h1>
        <Link href="/anfrage">
          <Button size="sm" data-testid="button-new-request">
            Neue Anfrage
          </Button>
        </Link>
      </div>
      {requests.map((r) => {
        const status = REQUEST_STATUS[r.status] ?? { label: r.status, variant: "secondary" as const };
        return (
          <Link key={r.id} href={`/meine-anfragen?request=${r.id}`}>
            <Card className="cursor-pointer hover:border-primary/40 transition-colors" data-testid={`card-request-${r.id}`}>
              <CardContent className="pt-6 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(r.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
