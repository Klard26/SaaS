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
} from "@workspace/api-client-react";
import { CheckCircle, Clock, MapPin, Calendar } from "lucide-react";
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
  const [confirmed, setConfirmed] = useState(false);

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

  const service = services.find(s => s.id === serviceId);
  const slot = slots.find(s => s.id === slotId);

  const isLoading = pLoad || sLoad || slLoad;

  async function handleConfirm() {
    try {
      await createBooking.mutateAsync({
        data: { providerId, serviceId, slotId, notes: notes || undefined }
      });
      qc.invalidateQueries({ queryKey: getListMyBookingsQueryKey() });
      setConfirmed(true);
    } catch {
      toast({ title: "Fehler", description: "Buchung konnte nicht abgeschlossen werden.", variant: "destructive" });
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Buchung bestatigt!</h1>
          <p className="text-muted-foreground mb-8">
            Ihre Buchung bei <strong>{provider?.displayName}</strong> wurde erfolgreich ubermittelt.
            Sie erhalten in Kurze eine Bestatigung.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setLocation("/bookings")} data-testid="button-my-bookings">
              Meine Buchungen
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-home">
              Zur Startseite
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-6">Buchung bestatigen</h1>

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Buchungsdetails</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-xs">{provider?.displayName.charAt(0)}</span>
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

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Anmerkungen (optional)
                </label>
                <Textarea
                  placeholder="Besondere Wunsche oder Informationen fur den Berater..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                Mit der Buchung bestatigen Sie, dass Sie die Nutzungsbedingungen von Klard gelesen und akzeptiert haben.
              </div>

              <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={createBooking.isPending}
                data-testid="button-confirm-booking"
              >
                {createBooking.isPending ? "Buchung wird bestatigt..." : "Buchung jetzt bestatigen"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
