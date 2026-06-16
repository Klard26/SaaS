import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { GuidedHeader } from "@/components/journey/GuidedHeader";
import { EmptyState } from "@/components/journey/EmptyState";
import {
  useGetMyProviderProfile, getGetMyProviderProfileQueryKey,
  useListAvailability, getListAvailabilityQueryKey,
  useCreateTimeSlot, useDeleteTimeSlot,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Calendar, Clock, CalendarClock } from "lucide-react";

export default function ProviderAvailability() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");

  const { data: profile, isLoading: profileLoading } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey() },
  });

  const { data: slots = [], isLoading: slotsLoading } = useListAvailability(
    profile?.id ?? 0,
    { query: { enabled: !!profile?.id, queryKey: getListAvailabilityQueryKey(profile?.id ?? 0) } }
  );

  const createSlot = useCreateTimeSlot();
  const deleteSlot = useDeleteTimeSlot();

  const availableSlots = slots.filter(s => s.isAvailable);
  const bookedSlots = slots.filter(s => !s.isAvailable);

  async function handleAddSlot() {
    if (!profile || !startDate || !startTime || !endTime) return;
    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${startDate}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
      toast({ title: "Fehler", description: "Endzeit muss nach der Startzeit liegen.", variant: "destructive" });
      return;
    }

    try {
      await createSlot.mutateAsync({
        data: {
          providerId: profile.id,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }
      });
      qc.invalidateQueries({ queryKey: getListAvailabilityQueryKey(profile.id) });
      toast({ title: "Termin hinzugefugt" });
    } catch {
      toast({ title: "Fehler", description: "Termin konnte nicht gespeichert werden.", variant: "destructive" });
    }
  }

  async function handleDelete(slotId: number) {
    if (!profile) return;
    try {
      await deleteSlot.mutateAsync({ params: { slotId } });
      qc.invalidateQueries({ queryKey: getListAvailabilityQueryKey(profile.id) });
      toast({ title: "Termin geloscht" });
    } catch {
      toast({ title: "Fehler", description: "Termin konnte nicht geloscht werden.", variant: "destructive" });
    }
  }

  const groupedSlots = availableSlots.reduce<Record<string, typeof availableSlots>>((acc, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  if (!profileLoading && !profile) {
    setLocation("/provider/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")} data-testid="button-back">
            Zum Dashboard
          </Button>
        </div>

        <GuidedHeader
          icon={CalendarClock}
          title="Verfügbarkeit verwalten"
          subtitle="Geben Sie Termine frei, damit Mandanten online bei Ihnen buchen können."
          steps={["Profil", "Leistungen", "Verfügbarkeit"]}
          current={2}
        />

        {/* Add slot form */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Neuen Termin hinzufugen</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Datum
                </label>
                <Input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-44"
                  data-testid="input-date"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Von
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-28"
                  data-testid="input-start-time"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Bis</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-28"
                  data-testid="input-end-time"
                />
              </div>
              <Button
                onClick={handleAddSlot}
                disabled={createSlot.isPending || !startDate || !startTime || !endTime}
                className="gap-1.5"
                data-testid="button-add-slot"
              >
                <PlusCircle className="h-4 w-4" />
                {createSlot.isPending ? "Wird hinzugefugt..." : "Termin hinzufugen"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Slots list */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Verfugbare Termine ({availableSlots.length})
            </h2>

            {slotsLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : Object.entries(groupedSlots).length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Keine verfügbaren Termine"
                description="Fügen Sie oben Termine hinzu, damit Mandanten buchen können."
              />
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <Card key={date}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <p className="text-sm font-semibold text-foreground">{date}</p>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="space-y-2">
                        {dateSlots.map(slot => (
                          <div key={slot.id} className="flex items-center justify-between py-1" data-testid={`slot-${slot.id}`}>
                            <span className="text-sm text-foreground">
                              {new Date(slot.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – {new Date(slot.endTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(slot.id)}
                              data-testid={`button-delete-slot-${slot.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Gebuchte Termine ({bookedSlots.length})
            </h2>
            {bookedSlots.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Noch keine gebuchten Termine"
                description="Sobald Mandanten buchen, erscheinen die Termine hier."
              />
            ) : (
              <div className="space-y-2">
                {bookedSlots.map(slot => (
                  <div key={slot.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/30" data-testid={`booked-slot-${slot.id}`}>
                    <Badge variant="secondary" className="text-xs shrink-0">Gebucht</Badge>
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {new Date(slot.startTime).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(slot.startTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – {new Date(slot.endTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
