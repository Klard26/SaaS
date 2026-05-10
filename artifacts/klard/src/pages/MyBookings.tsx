import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import {
  useListMyBookings, getListMyBookingsQueryKey,
  useCreateReview, getGetProviderQueryKey,
  useCreateBookingCheckout,
  getGetBookingCalendarFileUrl,
} from "@workspace/api-client-react";
import { Calendar, Clock, MapPin, Star, CreditCard, Download } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ausstehend",
  confirmed: "Bestatigt",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};

export default function MyBookings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [reviewProviderId, setReviewProviderId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: bookings = [], isLoading } = useListMyBookings({
    query: { queryKey: getListMyBookingsQueryKey() },
  });

  const createReview = useCreateReview();
  const payCheckout = useCreateBookingCheckout();

  async function handlePay(bookingId: number) {
    try {
      const res = await payCheckout.mutateAsync({ id: bookingId });
      if (res?.url) window.location.href = res.url;
    } catch {
      toast({ title: "Zahlung nicht verfügbar", description: "Stripe-Zahlungen sind noch nicht eingerichtet.", variant: "destructive" });
    }
  }

  const upcoming = bookings.filter(b => ["pending", "confirmed"].includes(b.status));
  const past = bookings.filter(b => ["completed", "cancelled"].includes(b.status));

  async function handleReviewSubmit() {
    if (!reviewBookingId || !reviewProviderId) return;
    try {
      await createReview.mutateAsync({ data: { bookingId: reviewBookingId, rating, comment } });
      qc.invalidateQueries({ queryKey: getGetProviderQueryKey(reviewProviderId) });
      toast({ title: "Danke!", description: "Ihre Bewertung wurde gespeichert." });
      setReviewBookingId(null);
      setComment("");
      setRating(5);
    } catch {
      toast({ title: "Fehler", description: "Bewertung konnte nicht gespeichert werden.", variant: "destructive" });
    }
  }

  function BookingCard({ booking }: { booking: typeof bookings[0] }) {
    return (
      <Card key={booking.id} className="hover:shadow-sm transition-shadow" data-testid={`card-booking-${booking.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-foreground">{booking.serviceName ?? "Leistung"}</p>
              <p className="text-sm text-muted-foreground">{booking.providerName}</p>
            </div>
            <Badge variant={STATUS_VARIANTS[booking.status] ?? "outline"} data-testid={`status-booking-${booking.id}`}>
              {STATUS_LABELS[booking.status] ?? booking.status}
            </Badge>
          </div>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{new Date(booking.scheduledAt).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{new Date(booking.scheduledAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  {booking.totalPrice === 0 ? "Kostenlos" : `${booking.totalPrice} €`}
                </span>
                <div className="flex items-center gap-1.5">
                  {booking.paymentRequired && booking.paymentStatus === "pending" && booking.status !== "cancelled" && (
                    <Badge variant="secondary" className="text-xs">Zahlung offen</Badge>
                  )}
                  {booking.paymentStatus === "paid" && (
                    <Badge className="text-xs bg-green-600 hover:bg-green-600">Bezahlt</Badge>
                  )}
                  {!booking.paymentRequired && booking.totalPrice > 0 && (
                    <Badge variant="outline" className="text-xs">Direkt mit Berater</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {booking.paymentRequired && booking.paymentStatus === "pending" && booking.status !== "cancelled" && (
                  <Button size="sm" className="gap-1.5 h-8" onClick={() => handlePay(booking.id)} data-testid={`button-pay-${booking.id}`}>
                    <CreditCard className="h-3.5 w-3.5" /> Jetzt bezahlen
                  </Button>
                )}
                {booking.status === "confirmed" && (
                  <a href={getGetBookingCalendarFileUrl(booking.id)} download data-testid={`link-ics-${booking.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8">
                      <Download className="h-3.5 w-3.5" /> Zum Kalender
                    </Button>
                  </a>
                )}
                {booking.status === "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8"
                    onClick={() => { setReviewBookingId(booking.id); setReviewProviderId(booking.providerId); }}
                    data-testid={`button-review-${booking.id}`}
                  >
                    <Star className="h-3.5 w-3.5" /> Bewertung
                  </Button>
                )}
                {["pending"].includes(booking.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setLocation(`/providers/${booking.providerId}`)}
                    data-testid={`button-provider-${booking.id}`}
                  >
                    Berater ansehen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Meine Buchungen</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Keine Buchungen vorhanden</p>
            <p className="text-sm mt-1">Buchen Sie Ihren ersten Berater.</p>
            <Button className="mt-4" onClick={() => setLocation("/search")} data-testid="button-find-providers">
              Berater finden
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Kommende Termine</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {upcoming.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Vergangene Termine</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {past.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!reviewBookingId} onOpenChange={() => setReviewBookingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bewertung abgeben</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Bewertung</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)} data-testid={`button-star-${n}`}>
                    <Star className={`h-7 w-7 transition-colors ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 hover:text-amber-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Kommentar (optional)</label>
              <Textarea
                placeholder="Wie war Ihre Erfahrung?"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                data-testid="textarea-review-comment"
              />
            </div>
            <Button className="w-full" onClick={handleReviewSubmit} disabled={createReview.isPending} data-testid="button-submit-review">
              {createReview.isPending ? "Wird gespeichert..." : "Bewertung absenden"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
