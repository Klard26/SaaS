import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import {
  useGetProvider, getGetProviderQueryKey,
  useListProviderServices, getListProviderServicesQueryKey,
  useListAvailability, getListAvailabilityQueryKey,
  useCreateBooking,
  getListMyBookingsQueryKey,
  useListAssessments, getListAssessmentsQueryKey,
} from "@workspace/api-client-react";
import { CheckCircle, Clock, MapPin, Calendar, Info, Download } from "lucide-react";
import { getGetBookingCalendarFileUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function BookingConfirmation() {
  const { providerId: pId, serviceId: sId, slotId: slId } = useParams<{
    providerId: string; serviceId: string; slotId: string;
  }>();
  const providerId = Number(pId);
  const serviceId = Number(sId);
  const slotId = Number(slId);

  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [assessmentId, setAssessmentId] = useState<string>("none");
  const [confirmed, setConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const { data: provider, isLoading: pLoad } = useGetProvider(providerId, {
    query: { enabled: !!providerId, queryKey: getGetProviderQueryKey(providerId) },
  });
  const { data: services = [], isLoading: sLoad } = useListProviderServices(providerId, {
    query: { enabled: !!providerId, queryKey: getListProviderServicesQueryKey(providerId) },
  });
  const { data: slots = [], isLoading: slLoad } = useListAvailability(providerId, {
    query: { enabled: !!providerId, queryKey: getListAvailabilityQueryKey(providerId) },
  });

  const createBooking = useCreateBooking();

  const { data: assessments = [] } = useListAssessments({
    query: { enabled: !!user, queryKey: getListAssessmentsQueryKey() },
  });

  const service = services.find(s => s.id === serviceId);
  const slot = slots.find(s => s.id === slotId);

  const isLoading = pLoad || sLoad || slLoad;

  async function handleConfirm() {
    try {
      const res = await createBooking.mutateAsync({
        data: {
          providerId,
          serviceId,
          slotId,
          notes: notes || undefined,
          assessmentId: assessmentId !== "none" ? Number(assessmentId) : undefined,
        }
      });
      qc.invalidateQueries({ queryKey: getListMyBookingsQueryKey() });
      if (res?.id) setBookingId(res.id);
      setConfirmed(true);
    } catch {
      toast({ title: "Fehler", description: "Buchung konnte nicht abgeschlossen werden.", variant: "destructive" });
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[var(--klard-bg)]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--klard-green-l)] mb-6 ring-8 ring-[var(--klard-green-l)]/40">
            <CheckCircle className="h-10 w-10 text-[var(--klard-green)]" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-3 tracking-tight">Buchung bestätigt</h1>
          <p className="text-[var(--klard-mid)] mb-6 leading-relaxed">
            Ihre Buchung bei <strong className="text-foreground">{provider?.displayName}</strong> wurde erfolgreich übermittelt.
            Sie erhalten in Kürze eine Bestätigungs-E-Mail.
          </p>
          {provider?.requiresDirectBilling && (
            <div className="text-sm mb-6 bg-gradient-to-br from-[#EFF6FF] to-[var(--klard-teal-p)] border border-[#BAE6FD] rounded-xl p-3.5 text-left">
              <strong className="text-[var(--klard-teal-d)]">RVG / StBVV-Hinweis:</strong>
              <span className="text-[var(--klard-slate)]"> Die Abrechnung erfolgt direkt mit der Kanzlei nach gesetzlichen Vorgaben.</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {bookingId && (
              <a href={getGetBookingCalendarFileUrl(bookingId)} download data-testid="link-ics-confirmation">
                <Button variant="outline" className="gap-1.5 rounded-full border-[1.5px]">
                  <Download className="h-4 w-4" /> Zum Kalender
                </Button>
              </a>
            )}
            <Button onClick={() => setLocation("/bookings")} className="rounded-full" data-testid="button-my-bookings">
              Meine Buchungen
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} className="rounded-full border-[1.5px]" data-testid="button-home">
              Zur Startseite
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--klard-bg)]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-serif text-3xl font-semibold text-foreground mb-6 tracking-tight">Buchung bestätigen</h1>

        {isLoading ? (
          <Skeleton className="h-64 rounded-[20px]" />
        ) : (
          <Card className="rounded-[20px] border-[1.5px] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Buchungsdetails</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[var(--klard-teal-l)] to-[var(--klard-teal-p)] flex items-center justify-center shrink-0 border border-border">
                    <span className="text-[var(--klard-teal-d)] font-bold text-sm">{provider?.displayName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{provider?.displayName}</p>
                    <p className="text-muted-foreground text-xs">{provider?.category}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-foreground">{service?.name}</span>
                  <span className="ml-auto font-semibold text-foreground">
                    {service?.price === 0 ? "Kostenlos" : `${service?.price} €`}
                  </span>
                </div>

                {slot && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{new Date(slot.startTime).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                )}
                {slot && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {new Date(slot.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – {new Date(slot.endTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                    </span>
                  </div>
                )}
                {provider?.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{provider.city}{provider.address ? ` · ${provider.address}` : ""}</span>
                  </div>
                )}
                {service?.durationMinutes && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Dauer: {service.durationMinutes} Minuten</span>
                  </div>
                )}
              </div>

              <Separator />

              {user && assessments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Gebäudeanalyse verknüpfen (optional)
                  </label>
                  <select
                    value={assessmentId}
                    onChange={(e) => setAssessmentId(e.target.value)}
                    className="w-full bg-white border-[1.5px] border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    data-testid="select-assessment"
                  >
                    <option value="none">— Keine verknüpfen —</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={String(a.id)}>{a.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Der Berater erhält Zugriff auf Ihre Analyse als Gesprächsgrundlage.
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Anmerkungen (optional)
                </label>
                <Textarea
                  placeholder="Besondere Wünsche oder Informationen für den Berater …"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="text-xs text-[var(--klard-mid)] bg-[var(--klard-bg)] border border-border rounded-xl p-3">
                Mit der Buchung bestätigen Sie, dass Sie die Nutzungsbedingungen von Klard gelesen und akzeptiert haben.
              </div>

              <Button
                className="w-full h-11 rounded-full font-bold"
                onClick={handleConfirm}
                disabled={createBooking.isPending}
                data-testid="button-confirm-booking"
              >
                {createBooking.isPending ? "Buchung wird bestätigt …" : "Buchung jetzt bestätigen"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
