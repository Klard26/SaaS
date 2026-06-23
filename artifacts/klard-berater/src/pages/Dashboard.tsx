import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { BookingStatusBadge } from "@/components/journey/StatusBadge";
import { PremiumBadge, BasicBadge } from "@/components/journey/Badges";
import {
  useGetMyProviderProfile, getGetMyProviderProfileQueryKey,
  useGetProviderDashboard, getGetProviderDashboardQueryKey,
  useListProviderBookings, getListProviderBookingsQueryKey,
  useUpdateBookingStatus, getListProviderBookingsQueryKey as providerBookingsKey,
  useGetMySubscription, getGetMySubscriptionQueryKey,
  useGetMyConnectStatus, getGetMyConnectStatusQueryKey,
  useCreateConnectOnboarding,
  useListProviderServices, getListProviderServicesQueryKey,
  useListAvailability, getListAvailabilityQueryKey,
  useListMyIcalConflicts, getListMyIcalConflictsQueryKey,
  getGetProviderCalendarFeedUrl,
} from "@workspace/api-client-react";
import { Star, TrendingUp, Calendar, DollarSign, Users, PlusCircle, Settings, Clock, Crown, Copy, Sparkles, Receipt, Banknote, CheckCircle2, Circle, ArrowRight, AlertCircle, CalendarX } from "lucide-react";
import { InvoicesPanel } from "@/components/InvoicesPanel";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

  const { data: connect } = useGetMyConnectStatus({
    query: { enabled: !!profile?.id, queryKey: getGetMyConnectStatusQueryKey() },
  });

  const { data: services = [] } = useListProviderServices(profile?.id ?? 0, {
    query: { enabled: !!profile?.id, queryKey: getListProviderServicesQueryKey(profile?.id ?? 0) },
  });

  const { data: slots = [] } = useListAvailability(profile?.id ?? 0, {
    query: { enabled: !!profile?.id, queryKey: getListAvailabilityQueryKey(profile?.id ?? 0) },
  });

  const { data: icalConflicts = [] } = useListMyIcalConflicts({
    query: { enabled: !!profile?.id, queryKey: getListMyIcalConflictsQueryKey() },
  });

  const createConnectOnboarding = useCreateConnectOnboarding();

  const updateStatus = useUpdateBookingStatus();

  async function startConnectOnboarding() {
    try {
      const res = await createConnectOnboarding.mutateAsync();
      if (res?.url) window.location.href = res.url;
    } catch {
      toast({ title: "Fehler", description: "Auszahlungskonto konnte nicht gestartet werden.", variant: "destructive" });
    }
  }

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

  // Refresh payout status when returning from Stripe Connect onboarding.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectParam = params.get("connect");
    if (connectParam !== "return" && connectParam !== "refresh") return;
    qc.invalidateQueries({ queryKey: getGetMyConnectStatusQueryKey() });
    if (connectParam === "return") {
      toast({ title: "Auszahlungskonto aktualisiert", description: "Ihr Stripe-Konto wurde verbunden." });
    }
    window.history.replaceState({}, "", window.location.pathname);
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

  // Guided-setup status: a provider is bookable once they have at least one
  // service AND at least one open time slot. Payout is recommended but optional.
  const hasServices = services.length > 0;
  const hasAvailability = slots.some((s) => s.isAvailable);
  const hasPayout = !!connect?.onboarded;
  const isBookable = hasServices && hasAvailability;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const setupSteps = [
    { key: "profil", label: "Profil angelegt", hint: "Name, Beschreibung und Kontaktdaten", done: true, optional: false, cta: "Profil bearbeiten", action: () => setLocation("/provider/profile") },
    { key: "leistungen", label: "Leistungen hinzufügen", hint: "Mindestens eine buchbare Leistung mit Preis", done: hasServices, optional: false, cta: "Leistungen verwalten", action: () => setLocation("/provider/services") },
    { key: "verfuegbarkeit", label: "Verfügbarkeit eintragen", hint: "Freie Termine, die Kunden buchen können", done: hasAvailability, optional: false, cta: "Termine hinzufügen", action: () => setLocation("/provider/availability") },
    { key: "auszahlung", label: "Auszahlungskonto verbinden", hint: "Optional – nötig, um Zahlungen zu empfangen", done: hasPayout, optional: true, cta: "Konto einrichten", action: startConnectOnboarding },
  ];
  const doneCount = setupSteps.filter((s) => !s.optional && s.done).length;
  const totalRequired = setupSteps.filter((s) => !s.optional).length;

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
              {isPremium ? <PremiumBadge size="md" /> : profile && <BasicBadge size="md" />}
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

        {/* Bookable status + guided setup checklist */}
        {profile && (
          isBookable ? (
            <Card className="mb-6 rounded-[20px] border-[1.5px] border-[var(--klard-green-l)] bg-[var(--klard-green-l)]/30 shadow-sm">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--klard-green-l)] shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-[var(--klard-green)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base font-semibold text-foreground">Sie sind buchbar</p>
                  <p className="text-xs text-[var(--klard-mid)] leading-relaxed mt-0.5">
                    Ihr Profil ist online und Kunden können Termine bei Ihnen buchen.
                    {!hasPayout && " Verbinden Sie noch ein Auszahlungskonto, um Zahlungen zu empfangen."}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 shrink-0 rounded-full border-[1.5px]" onClick={() => setLocation(`/providers/${profile.id}`)} data-testid="button-view-public-profile">
                  Profil ansehen <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 rounded-[20px] border-[1.5px] border-[var(--klard-gold-l)] bg-gradient-to-r from-[var(--klard-gold-l)]/40 to-amber-50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--klard-gold-l)] shrink-0">
                    <AlertCircle className="h-5 w-5 text-[var(--klard-gold)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base font-semibold text-foreground">Noch nicht buchbar</p>
                    <p className="text-xs text-[var(--klard-mid)] leading-relaxed mt-0.5">
                      Schließen Sie die folgenden Schritte ab, damit Kunden Termine bei Ihnen buchen können
                      ({doneCount} von {totalRequired} erledigt).
                    </p>
                  </div>
                </div>
                <Progress
                  value={totalRequired > 0 ? (doneCount / totalRequired) * 100 : 0}
                  className="mb-4 h-2"
                  data-testid="progress-setup"
                />
                <div className="space-y-2">
                  {setupSteps.map((step) => (
                    <div
                      key={step.key}
                      className="flex items-center gap-3 rounded-xl border-[1.5px] border-border bg-white px-4 py-3"
                      data-testid={`setup-step-${step.key}`}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--klard-green)] shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {step.label}
                          {step.optional && <span className="ml-2 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">optional</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.hint}</p>
                      </div>
                      {!step.done && (
                        <Button size="sm" className="gap-1.5 shrink-0 rounded-full" onClick={step.action} data-testid={`button-setup-${step.key}`}>
                          {step.cta} <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Pending bookings highlight */}
        {profile && pendingCount > 0 && (
          <Card className="mb-6 rounded-[20px] border-[1.5px] border-[var(--klard-teal-p)] bg-[var(--klard-teal-l)]/40 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--klard-teal-d)] shrink-0" />
              <p className="text-sm text-foreground flex-1">
                <strong>{pendingCount}</strong> {pendingCount === 1 ? "Anfrage wartet" : "Anfragen warten"} auf Ihre Bestätigung.
              </p>
            </CardContent>
          </Card>
        )}

        {/* External-calendar conflicts with Klard bookings */}
        {profile && icalConflicts.length > 0 && (
          <Card className="mb-6 rounded-[20px] border-[1.5px] border-[var(--klard-gold-l)] bg-gradient-to-r from-[var(--klard-gold-l)]/40 to-amber-50 shadow-sm" data-testid="card-ical-conflicts">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--klard-gold-l)] shrink-0">
                  <CalendarX className="h-5 w-5 text-[var(--klard-gold)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base font-semibold text-foreground">
                    Kalender-Konflikt erkannt
                  </p>
                  <p className="text-xs text-[var(--klard-mid)] leading-relaxed mt-0.5">
                    Ihr externer Kalender enthält {icalConflicts.length === 1 ? "einen Termin, der" : `${icalConflicts.length} Termine, die`} mit
                    {icalConflicts.length === 1 ? " einer bestehenden Klard-Buchung" : " bestehenden Klard-Buchungen"} kollidiert.
                    Die Klard-Buchung bleibt bestehen — der überschneidende externe Termin wurde nicht übernommen. Bitte prüfen Sie den Konflikt in Ihrem externen Kalender.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {icalConflicts.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border-[1.5px] border-border bg-white px-4 py-3"
                    data-testid={`ical-conflict-${c.id}`}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {[c.bookingServiceName, c.bookingCustomerName].filter(Boolean).join(" · ") || "Klard-Buchung"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Klard-Termin: {new Date(c.bookingScheduledAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })} Uhr
                    </p>
                    <p className="text-xs text-[var(--klard-gold)] mt-1">
                      Externer Termin{c.externalSummary ? ` „${c.externalSummary}“` : ""}: {new Date(c.externalStart).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}–{new Date(c.externalEnd).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Stripe Connect payout account */}
        {profile && connect && (
          connect.onboarded ? (
            <Card className="mb-6 rounded-[20px] border-[1.5px] border-[var(--klard-teal-p)] bg-[var(--klard-teal-l)]/30 shadow-sm">
              <CardContent className="p-5 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[var(--klard-teal-d)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-serif text-base font-semibold text-foreground">Auszahlungskonto aktiv</span>
                  <p className="text-xs text-[var(--klard-mid)] leading-relaxed mt-0.5">
                    Zahlungen Ihrer Mandanten werden nach Abzug der Plattformprovision automatisch auf Ihr Stripe-Konto ausgezahlt.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 rounded-[20px] border-[1.5px] border-[var(--klard-gold-l)] bg-gradient-to-r from-[var(--klard-gold-l)]/30 to-amber-50 shadow-sm">
              <CardContent className="p-5 flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Banknote className="h-4 w-4 text-[var(--klard-gold)]" />
                    <span className="font-serif text-base font-semibold text-foreground">Auszahlungskonto einrichten</span>
                  </div>
                  <p className="text-sm text-[var(--klard-mid)] leading-relaxed">
                    Verbinden Sie ein Stripe-Konto, um Zahlungen Ihrer Mandanten direkt zu empfangen. Die Plattformprovision wird automatisch einbehalten.
                  </p>
                </div>
                <Button size="sm" className="gap-1.5 shrink-0 rounded-full bg-[var(--klard-gold)] hover:bg-[#92400E] text-white" onClick={startConnectOnboarding} disabled={createConnectOnboarding.isPending} data-testid="button-connect-onboard">
                  <Banknote className="h-3.5 w-3.5" /> {createConnectOnboarding.isPending ? "Wird geöffnet..." : "Konto einrichten"}
                </Button>
              </CardContent>
            </Card>
          )
        )}

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
            <TabsTrigger value="invoices" data-testid="tab-invoices-section">
              <Receipt className="h-4 w-4 mr-1.5" /> Rechnungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-4">
            <InvoicesPanel />
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
                          <BookingStatusBadge status={booking.status} className="text-xs" />
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

