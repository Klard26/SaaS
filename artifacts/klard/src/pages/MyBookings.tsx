import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { BookingStatusBadge } from "@/components/journey/StatusBadge";
import { PaymentBadge } from "@/components/journey/PaymentBadge";
import { EmptyState } from "@/components/journey/EmptyState";
import {
  useListMyBookings, getListMyBookingsQueryKey,
  useCreateReview, getGetProviderQueryKey,
  useCreateBookingCheckout,
  getGetBookingCalendarFileUrl,
  useListMyCustomerInvoices, getListMyCustomerInvoicesQueryKey,
  getGetInvoicePdfUrl,
} from "@workspace/api-client-react";
import { Calendar, Clock, Star, CreditCard, Download, FileText } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

  const { data: invoices = [] } = useListMyCustomerInvoices({
    query: { queryKey: getListMyCustomerInvoicesQueryKey() },
  });
  const invoiceByBooking = new Map(
    invoices.filter((i) => i.kind === "invoice").map((i) => [i.bookingId, i]),
  );

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
      <Card key={booking.id} className="rounded-[20px] border-[1.5px] shadow-sm hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all" data-testid={`card-booking-${booking.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="font-serif text-lg font-semibold text-foreground tracking-tight">{booking.serviceName ?? "Leistung"}</p>
              <p className="text-sm text-[var(--klard-mid)]">{booking.providerName}</p>
            </div>
            <BookingStatusBadge status={booking.status} data-testid={`status-booking-${booking.id}`} />
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
                <span className="font-serif text-xl font-semibold text-[var(--klard-teal-d)]">
                  {booking.totalPrice === 0 ? "Kostenlos" : `${booking.totalPrice} €`}
                </span>
                <div className="flex items-center gap-1.5">
                  {booking.paymentRequired && booking.paymentStatus === "pending" && booking.status !== "cancelled" && (
                    <PaymentBadge variant="offen" />
                  )}
                  {booking.paymentStatus === "paid" && <PaymentBadge variant="bezahlt" />}
                  {!booking.paymentRequired && booking.totalPrice > 0 && (
                    <PaymentBadge variant="direkt" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {booking.paymentRequired && booking.paymentStatus === "pending" && booking.status !== "cancelled" && (
                  <Button size="sm" className="gap-1.5 h-8 rounded-full" onClick={() => handlePay(booking.id)} data-testid={`button-pay-${booking.id}`}>
                    <CreditCard className="h-3.5 w-3.5" /> Jetzt bezahlen
                  </Button>
                )}
                {booking.status === "confirmed" && (
                  <a href={getGetBookingCalendarFileUrl(booking.id)} download data-testid={`link-ics-${booking.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 rounded-full border-[1.5px]">
                      <Download className="h-3.5 w-3.5" /> Zum Kalender
                    </Button>
                  </a>
                )}
                {invoiceByBooking.get(booking.id)?.hasPdf && (
                  <a
                    href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api${getGetInvoicePdfUrl(invoiceByBooking.get(booking.id)!.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`link-invoice-${booking.id}`}
                  >
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 rounded-full border-[1.5px]">
                      <FileText className="h-3.5 w-3.5" /> Rechnung
                    </Button>
                  </a>
                )}
                {booking.status === "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 rounded-full border-[1.5px]"
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
                    className="h-8 rounded-full border-[1.5px]"
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
    <div className="min-h-screen bg-[var(--klard-bg)]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-8 tracking-tight">Meine Buchungen</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Keine Buchungen vorhanden"
            description="Buchen Sie Ihren ersten Berater."
          >
            <Button className="rounded-full" onClick={() => setLocation("/search")} data-testid="button-find-providers">
              Berater finden
            </Button>
          </EmptyState>
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
