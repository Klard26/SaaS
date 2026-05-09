import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import {
  useGetMyProviderProfile, getGetMyProviderProfileQueryKey,
  useGetProviderDashboard, getGetProviderDashboardQueryKey,
  useListProviderBookings, getListProviderBookingsQueryKey,
  useUpdateBookingStatus, getListProviderBookingsQueryKey as providerBookingsKey,
} from "@workspace/api-client-react";
import { Star, TrendingUp, Calendar, DollarSign, Users, PlusCircle, Settings, Clock } from "lucide-react";
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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey() },
  });

  const { data: stats, isLoading: statsLoading } = useGetProviderDashboard(
    profile?.id ?? 0,
    { query: { enabled: !!profile?.id, queryKey: getGetProviderDashboardQueryKey(profile?.id ?? 0) } }
  );

  const { data: bookings = [], isLoading: bookingsLoading } = useListProviderBookings(
    profile?.id ?? 0,
    { query: { enabled: !!profile?.id, queryKey: getListProviderBookingsQueryKey(profile?.id ?? 0) } }
  );

  const updateStatus = useUpdateBookingStatus();

  async function handleStatusChange(bookingId: number, status: "confirmed" | "cancelled" | "completed") {
    try {
      await updateStatus.mutateAsync({ id: bookingId, data: { status } });
      qc.invalidateQueries({ queryKey: providerBookingsKey(profile?.id ?? 0) });
      toast({ title: "Status aktualisiert" });
    } catch {
      toast({ title: "Fehler", description: "Status konnte nicht geandert werden.", variant: "destructive" });
    }
  }

  const isLoading = profileLoading || statsLoading;

  if (!profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Kein Berater-Profil</h1>
          <p className="text-muted-foreground mb-8">
            Sie haben noch kein Berater-Profil. Registrieren Sie sich als Berater, um Buchungen entgegenzunehmen und Ihr Dashboard zu verwalten.
          </p>
          <Button onClick={() => setLocation("/provider/onboarding")} data-testid="button-create-profile">
            <PlusCircle className="mr-2 h-4 w-4" />
            Als Berater registrieren
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            {profile && <p className="text-muted-foreground mt-0.5">{profile.displayName}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/provider/profile")} className="gap-1.5" data-testid="button-edit-profile">
              <Settings className="h-4 w-4" /> Profil
            </Button>
            <Button size="sm" onClick={() => setLocation("/provider/availability")} className="gap-1.5" data-testid="button-manage-availability">
              <Calendar className="h-4 w-4" /> Verfugbarkeit
            </Button>
          </div>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : stats ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Calendar, label: "Gesamte Buchungen", value: stats.totalBookings, sub: `${stats.pendingBookings} ausstehend` },
              { icon: DollarSign, label: "Gesamtumsatz", value: `${stats.totalRevenue} €`, sub: "Alle Zeiten" },
              { icon: Star, label: "Bewertung", value: stats.averageRating?.toFixed(1) ?? "–", sub: `${stats.confirmedBookings} bestatigt` },
              { icon: TrendingUp, label: "Abgeschlossen", value: stats.completedBookings, sub: "Abgeschlossene Termine" },
            ].map(({ icon: Icon, label, value, sub }) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setLocation("/provider/services")} data-testid="button-manage-services">
            <PlusCircle className="h-5 w-5" />
            <span className="text-sm">Leistungen verwalten</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setLocation("/provider/availability")} data-testid="button-add-slots">
            <Clock className="h-5 w-5" />
            <span className="text-sm">Termine hinzufugen</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => profile && setLocation(`/providers/${profile.id}`)} data-testid="button-view-profile">
            <Users className="h-5 w-5" />
            <span className="text-sm">Offentliches Profil</span>
          </Button>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buchungen</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {bookingsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Buchungen erhalten.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Kunde</th>
                      <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Leistung</th>
                      <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Datum</th>
                      <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Preis</th>
                      <th className="text-left font-medium text-muted-foreground pb-3">Status</th>
                      <th className="text-left font-medium text-muted-foreground pb-3 pl-4">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.slice(0, 20).map(booking => (
                      <tr key={booking.id} data-testid={`row-booking-${booking.id}`} className="group">
                        <td className="py-3 pr-4 font-medium text-foreground">{booking.customerName ?? "Anonym"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{booking.serviceName}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(booking.scheduledAt).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                          {" "}
                          {new Date(booking.scheduledAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 pr-4 font-medium text-foreground">
                          {booking.totalPrice === 0 ? "—" : `${booking.totalPrice} €`}
                        </td>
                        <td className="py-3">
                          <Badge variant={STATUS_VARIANTS[booking.status] ?? "outline"} className="text-xs">
                            {STATUS_LABELS[booking.status] ?? booking.status}
                          </Badge>
                        </td>
                        <td className="py-3 pl-4">
                          {booking.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(booking.id, "confirmed")} data-testid={`button-confirm-${booking.id}`}>
                                Bestatigen
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleStatusChange(booking.id, "cancelled")} data-testid={`button-cancel-${booking.id}`}>
                                Ablehnen
                              </Button>
                            </div>
                          )}
                          {booking.status === "confirmed" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(booking.id, "completed")} data-testid={`button-complete-${booking.id}`}>
                              Abschliessen
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
