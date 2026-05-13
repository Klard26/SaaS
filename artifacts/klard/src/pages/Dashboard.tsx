import { useEffect } from "react";
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
  useGetMySubscription, getGetMySubscriptionQueryKey,
  getGetProviderCalendarFeedUrl,
} from "@workspace/api-client-react";
import { Star, TrendingUp, Calendar, DollarSign, Users, PlusCircle, Settings, Clock, Crown, Copy, Sparkles, Building2, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EnergieVollanalyse } from "@/components/EnergieVollanalyse";
import {
  useCreateAssessment,
  useListAssessments,
  useDeleteAssessment,
  getListAssessmentsQueryKey,
} from "@workspace/api-client-react";
import {
  calcEnergie, calcWert, calcValue, calcRestnutzung, calcRisk, calcESG, calcSolar,
  type BuildingInput,
} from "@workspace/energie-calc";
import { useState } from "react";
import { Trash2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
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

  const { data: subscription } = useGetMySubscription({
    query: { enabled: !!profile?.id, queryKey: getGetMySubscriptionQueryKey() },
  });

  const updateStatus = useUpdateBookingStatus();

  // Reconcile billing state when returning from a successful Stripe Checkout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") !== "success") return;
    (async () => {
      try {
        await fetch(`${import.meta.env.BASE_URL}api/billing/reconcile`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        /* ignore */
      }
      qc.invalidateQueries({ queryKey: getGetMySubscriptionQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyProviderProfileQueryKey() });
      toast({ title: "Premium aktiviert", description: "Vielen Dank! Ihre Mitgliedschaft ist aktiv." });
      window.history.replaceState({}, "", window.location.pathname);
    })();
  }, [qc, toast]);

  const isPremium = subscription?.tier === "premium";
  const calendarFeedUrl = profile?.id && profile.icalToken
    ? `${window.location.origin}${getGetProviderCalendarFeedUrl(profile.id)}?token=${profile.icalToken}`
    : null;

  function copyCalendarUrl() {
    if (!calendarFeedUrl) return;
    navigator.clipboard.writeText(calendarFeedUrl);
    toast({ title: "Kalender-Link kopiert", description: "In Apple/Google/Outlook Kalender als Abo hinzufügen." });
  }

  async function handleStatusChange(bookingId: number, status: "confirmed" | "cancelled" | "completed") {
    try {
      await updateStatus.mutateAsync({ id: bookingId, data: { status } });
      qc.invalidateQueries({ queryKey: providerBookingsKey(profile?.id ?? 0) });
      toast({ title: "Status aktualisiert" });
    } catch {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden.", variant: "destructive" });
    }
  }

  const isLoading = profileLoading || statsLoading;

  if (!profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-[var(--klard-bg)]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--klard-teal-l)] mb-6 ring-8 ring-[var(--klard-teal-l)]/40">
            <Users className="h-10 w-10 text-[var(--klard-teal-d)]" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-3 tracking-tight">Kein Berater-Profil</h1>
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
    <div className="min-h-screen bg-[var(--klard-bg)]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-3xl font-semibold text-foreground tracking-tight">Dashboard</h1>
              {isPremium ? (
                <span className="inline-flex items-center gap-1 bg-[var(--klard-gold-l)] text-[var(--klard-gold)] text-xs font-bold px-2.5 py-1 rounded-full">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              ) : profile && (
                <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border-[1.5px] border-border text-muted-foreground">Basic</span>
              )}
            </div>
            {profile && <p className="text-[var(--klard-mid)] mt-1">{profile.displayName}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/provider/profile")} className="gap-1.5 rounded-full border-[1.5px]" data-testid="button-edit-profile">
              <Settings className="h-4 w-4" /> Profil
            </Button>
            <Button size="sm" onClick={() => setLocation("/provider/availability")} className="gap-1.5 rounded-full" data-testid="button-manage-availability">
              <Calendar className="h-4 w-4" /> Verfügbarkeit
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
              { icon: Star, label: "Bewertung", value: stats.averageRating?.toFixed(1) ?? "–", sub: `${stats.confirmedBookings} bestätigt` },
              { icon: TrendingUp, label: "Abgeschlossen", value: stats.completedBookings, sub: "Abgeschlossene Termine" },
            ].map(({ icon: Icon, label, value, sub }) => (
              <Card key={label} className="rounded-[20px] border-[1.5px] shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-[var(--klard-teal-l)]">
                      <Icon className="h-4 w-4 text-[var(--klard-teal-d)]" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="font-serif text-3xl font-semibold text-foreground tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Premium upsell or calendar sync */}
        {profile && (isPremium ? (
          calendarFeedUrl && (
            <Card className="mb-6 rounded-[20px] border-[1.5px] border-[var(--klard-teal-p)] bg-[var(--klard-teal-l)]/40 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar className="h-4 w-4 text-[var(--klard-teal-d)]" />
                      <span className="font-serif text-base font-semibold text-foreground">Kalender synchronisieren</span>
                    </div>
                    <p className="text-xs text-[var(--klard-mid)] mb-2 leading-relaxed">
                      Abonnieren Sie diesen iCal-Link in Apple Calendar, Google Calendar oder Outlook, um alle bestätigten Buchungen automatisch in Ihrem Kalender zu sehen.
                    </p>
                    <code className="text-xs bg-white px-2 py-1.5 rounded border border-border block truncate font-mono">{calendarFeedUrl}</code>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyCalendarUrl} className="gap-1.5 shrink-0 rounded-full border-[1.5px]" data-testid="button-copy-calendar">
                    <Copy className="h-3.5 w-3.5" /> Link kopieren
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="mb-6 rounded-[20px] border-[1.5px] border-[var(--klard-gold-l)] bg-gradient-to-r from-[var(--klard-gold-l)]/40 to-amber-50 shadow-sm">
            <CardContent className="p-5 flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-4 w-4 text-[var(--klard-gold)]" />
                  <span className="font-serif text-base font-semibold text-foreground">Mehr Mandanten mit Premium</span>
                </div>
                <p className="text-sm text-[var(--klard-mid)] leading-relaxed">
                  Premium-Berater erhalten priorisierte Suchplatzierung, Kalendersynchronisierung, KI-Tools und 4 % statt 9 % Provision — ab 89 €/Monat.
                </p>
              </div>
              <Button size="sm" className="gap-1.5 shrink-0 rounded-full bg-[var(--klard-gold)] hover:bg-[#92400E] text-white" onClick={() => setLocation("/pricing")} data-testid="button-upgrade-dashboard">
                <Crown className="h-3.5 w-3.5" /> Upgrade auf Premium
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: PlusCircle, label: "Leistungen verwalten", to: "/provider/services", testId: "button-manage-services" },
            { icon: Clock, label: "Termine hinzufügen", to: "/provider/availability", testId: "button-add-slots" },
            { icon: Users, label: "Öffentliches Profil", to: profile ? `/providers/${profile.id}` : "#", testId: "button-view-profile" },
          ].map(({ icon: Icon, label, to, testId }) => (
            <button
              key={testId}
              onClick={() => setLocation(to)}
              data-testid={testId}
              className="bg-white border-[1.5px] border-border rounded-[16px] py-5 px-4 flex flex-col items-center gap-2 hover:border-primary hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <div className="p-2.5 rounded-full bg-[var(--klard-teal-l)]">
                <Icon className="h-5 w-5 text-[var(--klard-teal-d)]" />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </button>
          ))}
        </div>

        {/* Tabs: Buchungen / Gebäudeanalyse */}
        <Tabs defaultValue="bookings" className="mb-2">
          <TabsList>
            <TabsTrigger value="bookings" data-testid="tab-bookings-section">
              <Calendar className="h-4 w-4 mr-1.5" /> Buchungen
            </TabsTrigger>
            <TabsTrigger value="gebaeude" data-testid="tab-gebaeude-section">
              <Building2 className="h-4 w-4 mr-1.5" /> Gebäudeanalyse
              {!isPremium && <Lock className="h-3 w-3 ml-1.5 text-muted-foreground" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gebaeude" className="mt-4">
            {isPremium && profile ? (
              <ProviderGebaeudeanalyse providerId={profile.id} />
            ) : (
              <Card className="rounded-[20px] border-[1.5px] border-dashed">
                <CardContent className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--klard-gold-l)] mb-4">
                    <Building2 className="h-7 w-7 text-[var(--klard-gold)]" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    Gebäudeanalyse — Premium-Funktion
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
                    Erstellen Sie für jeden Mandanten eine vollständige Energie-, Wert- und
                    Risikoanalyse — speichern Sie Vorgänge in Ihrem Profil und nutzen Sie sie
                    als Grundlage für Beratungstermine und Sanierungsfahrpläne.
                  </p>
                  <Button
                    className="rounded-full bg-[var(--klard-gold)] hover:bg-[#92400E] text-white"
                    onClick={() => setLocation("/pricing")}
                    data-testid="button-premium-gebaeude"
                  >
                    <Crown className="h-4 w-4 mr-1.5" /> Auf Premium upgraden
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-4">
        {/* Recent Bookings */}
        <Card className="rounded-[20px] border-[1.5px] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg font-semibold">Buchungen</CardTitle>
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
                        <td className="py-3 pr-4 font-medium text-foreground">
                          {booking.customerName ?? "Anonym"}
                          {booking.assessmentLabel && (
                            <div className="mt-0.5">
                              <Badge variant="outline" className="text-[10px] font-normal" data-testid={`badge-mandant-${booking.id}`}>
                                Mandant: {booking.assessmentLabel}
                              </Badge>
                            </div>
                          )}
                        </td>
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
                              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full border-[1.5px]" onClick={() => handleStatusChange(booking.id, "confirmed")} data-testid={`button-confirm-${booking.id}`}>
                                Bestätigen
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive rounded-full" onClick={() => handleStatusChange(booking.id, "cancelled")} data-testid={`button-cancel-${booking.id}`}>
                                Ablehnen
                              </Button>
                            </div>
                          )}
                          {booking.status === "confirmed" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-full border-[1.5px]" onClick={() => handleStatusChange(booking.id, "completed")} data-testid={`button-complete-${booking.id}`}>
                              Abschließen
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProviderGebaeudeanalyse({ providerId }: { providerId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateAssessment();
  const del = useDeleteAssessment();
  const { data = [] } = useListAssessments();
  const [saving, setSaving] = useState(false);

  const mine = data.filter((a) => a.providerId === providerId);

  async function handleSave(input: BuildingInput, label: string) {
    setSaving(true);
    try {
      const energie = calcEnergie(input);
      const wert = calcWert(input);
      const result = {
        energie,
        wert,
        value: calcValue(input, energie),
        restnutzung: calcRestnutzung(input, energie, wert),
        risk: calcRisk(input),
        esg: calcESG(energie),
        solar: calcSolar(input),
        generatedAt: new Date().toISOString(),
      };
      await create.mutateAsync({
        data: {
          label,
          providerId,
          inputJson: input as unknown as Record<string, unknown>,
          resultJson: result as unknown as Record<string, unknown>,
          addressJson: { plz: input.plz, city: input.city ?? null },
        },
      });
      toast({ title: "Mandant gespeichert", description: label });
      qc.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
    } catch (e) {
      toast({
        title: "Speichern fehlgeschlagen",
        description: e instanceof Error ? e.message : "Bitte später erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {mine.length > 0 && (
        <Card className="rounded-[20px] border-[1.5px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Gespeicherte Mandanten ({mine.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mine.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3" data-testid={`provider-saved-${a.id}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-sm truncate">{a.label}</div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Eintrag löschen?")) return;
                        try {
                          await del.mutateAsync({ id: a.id });
                          toast({ title: "Gelöscht" });
                          qc.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
                        } catch {
                          toast({ title: "Löschen fehlgeschlagen", variant: "destructive" });
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      data-testid={`provider-delete-${a.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("de-DE")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <EnergieVollanalyse onSave={handleSave} saving={saving} showSave />
    </div>
  );
}
