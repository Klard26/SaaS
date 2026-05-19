import { useState } from "react";
import { useUser } from "@clerk/react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  useGetAdminMe, getGetAdminMeQueryKey,
  useGetAdminStats, getGetAdminStatsQueryKey,
  useGetAdminTimeseries, getGetAdminTimeseriesQueryKey,
  useListAdminProviders, getListAdminProvidersQueryKey,
  useListAdminCustomers, getListAdminCustomersQueryKey,
  useListAdminBookings, getListAdminBookingsQueryKey,
  useListAdminCategories, getListAdminCategoriesQueryKey,
} from "@workspace/api-client-react";
import type { ListAdminBookingsStatus } from "@workspace/api-client-react";
import {
  Activity, Users, Building2, Calendar, CreditCard, Star, Shield, Receipt,
  TrendingUp, Crown, BadgeCheck,
} from "lucide-react";

function eur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function eurEuros(euros: number): string {
  return euros.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function dt(s: string): string {
  return new Date(s).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}
function d(s: string): string {
  return new Date(s).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Admin() {
  const { isLoaded, isSignedIn } = useUser();
  const { data: me, isLoading: meLoading } = useGetAdminMe({
    query: { queryKey: getGetAdminMeQueryKey(), enabled: !!isSignedIn },
  });

  if (!isLoaded || meLoading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navbar />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-10 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!isSignedIn || !me?.isAdmin) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navbar />
        <div className="max-w-[640px] mx-auto px-4 sm:px-8 py-20">
          <Card className="rounded-[20px] border-[1.5px]">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" /> Zugriff verweigert
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground" data-testid="text-admin-forbidden">
              Diese Seite ist nur für Plattform-Administratoren zugänglich.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight" data-testid="text-admin-title">
              Plattform-Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Übersicht aller Buchungen, Anbieter, Kunden und Umsätze auf Klard.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full border-[1.5px] gap-1">
            <Shield className="h-3 w-3" /> Admin
          </Badge>
        </div>

        <StatsRow />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-admin-overview"><Activity className="h-4 w-4 mr-1.5" /> Übersicht</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-admin-bookings"><Calendar className="h-4 w-4 mr-1.5" /> Buchungen</TabsTrigger>
            <TabsTrigger value="providers" data-testid="tab-admin-providers"><Building2 className="h-4 w-4 mr-1.5" /> Anbieter</TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-admin-customers"><Users className="h-4 w-4 mr-1.5" /> Kunden</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-admin-categories"><TrendingUp className="h-4 w-4 mr-1.5" /> Kategorien</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            <TimeseriesPanel />
            <TopProvidersPanel />
          </TabsContent>

          <TabsContent value="bookings" className="mt-4">
            <BookingsPanel />
          </TabsContent>

          <TabsContent value="providers" className="mt-4">
            <ProvidersPanel />
          </TabsContent>

          <TabsContent value="customers" className="mt-4">
            <CustomersPanel />
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <CategoriesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, testid }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  testid: string;
}) {
  return (
    <Card className="rounded-[20px] border-[1.5px]" data-testid={testid}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 font-serif text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function StatsRow() {
  const { data: stats, isLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() },
  });
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard icon={Calendar} label="Buchungen" value={String(stats.bookings.total)}
        sub={`${stats.bookings.confirmed} bestätigt · ${stats.bookings.cancelled} storniert`}
        testid="stat-bookings" />
      <StatCard icon={CreditCard} label="Bezahlt" value={eur(stats.bookings.revenuePaidCents)}
        sub={`gesamt ${eur(stats.bookings.revenueAll)}`}
        testid="stat-revenue" />
      <StatCard icon={Building2} label="Anbieter" value={String(stats.providers.total)}
        sub={`${stats.providers.premium} Premium · ${stats.providers.verified} verifiziert`}
        testid="stat-providers" />
      <StatCard icon={Users} label="Kunden" value={String(stats.customers.total)}
        sub="aktive Buchungs-Identitäten"
        testid="stat-customers" />
      <StatCard icon={Star} label="Bewertungen" value={String(stats.reviews.total)}
        sub={`Ø ${stats.reviews.averageRating.toFixed(2)} / 5`}
        testid="stat-reviews" />
      <StatCard icon={Receipt} label="Rechnungen" value={String(stats.invoices.total)}
        sub={`${stats.invoices.storno} Storno · ${eur(stats.invoices.totalCents)}`}
        testid="stat-invoices" />
    </div>
  );
}

function TimeseriesPanel() {
  const [days, setDays] = useState(30);
  const { data: points = [], isLoading } = useGetAdminTimeseries(
    { days },
    { query: { queryKey: getGetAdminTimeseriesQueryKey({ days }) } },
  );

  const maxBookings = Math.max(1, ...points.map((p) => p.bookings));
  const maxRev = Math.max(1, ...points.map((p) => p.paidRevenueCents));
  const totalBookings = points.reduce((s, p) => s + p.bookings, 0);
  const totalRev = points.reduce((s, p) => s + p.paidRevenueCents, 0);

  return (
    <Card className="rounded-[20px] border-[1.5px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="font-serif text-lg font-semibold">Verlauf</CardTitle>
          <div className="flex gap-1.5">
            {[7, 30, 90, 365].map((n) => (
              <button
                key={n}
                onClick={() => setDays(n)}
                className={`px-3 h-7 rounded-full text-xs font-medium border-[1.5px] ${
                  days === n ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border"
                }`}
                data-testid={`button-timerange-${n}`}
              >{n} Tage</button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : points.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Daten im gewählten Zeitraum.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Buchungen ({days} Tage)</div>
                <div className="font-serif text-xl font-semibold">{totalBookings}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Bezahlter Umsatz ({days} Tage)</div>
                <div className="font-serif text-xl font-semibold">{eur(totalRev)}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 h-32 min-w-fit" data-testid="chart-timeseries">
                {points.map((p) => (
                  <div key={p.day} className="flex flex-col items-center gap-0.5 group" title={`${p.day}: ${p.bookings} Buchungen, ${eur(p.paidRevenueCents)}`}>
                    <div className="flex flex-col items-center gap-0.5 justify-end h-32">
                      <div
                        className="w-3 rounded-t bg-[var(--klard-teal)]"
                        style={{ height: `${(p.paidRevenueCents / maxRev) * 100}%` }}
                      />
                      <div
                        className="w-3 rounded-t bg-amber-400 opacity-80"
                        style={{ height: `${Math.max(2, (p.bookings / maxBookings) * 40)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[var(--klard-teal)] inline-block" /> bez. Umsatz</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Buchungen</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TopProvidersPanel() {
  const { data: providers = [], isLoading } = useListAdminProviders({
    query: { queryKey: getListAdminProvidersQueryKey() },
  });
  const top = [...providers].sort((a, b) => b.paidRevenueCents - a.paidRevenueCents).slice(0, 5);
  return (
    <Card className="rounded-[20px] border-[1.5px]">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg font-semibold">Top-Anbieter (nach bezahltem Umsatz)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Anbieter mit Umsatz.</p>
        ) : (
          <ul className="space-y-2">
            {top.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3" data-testid={`top-provider-${p.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">{i + 1}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{p.displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.category} · {p.city}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-semibold">{eur(p.paidRevenueCents)}</div>
                  <div className="text-xs text-muted-foreground">{p.bookingCount} Buchungen · {p.distinctCustomers} Kunden</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Offen",
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};
const PAYMENT_LABELS: Record<string, string> = {
  paid: "Bezahlt",
  pending: "Offen",
  failed: "Fehlgeschlagen",
  refunded: "Erstattet",
  not_required: "Direkt",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900",
    confirmed: "bg-emerald-100 text-emerald-900",
    completed: "bg-sky-100 text-sky-900",
    cancelled: "bg-rose-100 text-rose-900",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] ?? "bg-secondary"}`}>{STATUS_LABELS[status] ?? status}</span>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-900",
    pending: "bg-amber-100 text-amber-900",
    failed: "bg-rose-100 text-rose-900",
    refunded: "bg-slate-200 text-slate-900",
    not_required: "bg-secondary text-muted-foreground",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] ?? "bg-secondary"}`}>{PAYMENT_LABELS[status] ?? status}</span>;
}

function BookingsPanel() {
  const [statusFilter, setStatusFilter] = useState<ListAdminBookingsStatus | undefined>(undefined);
  const params = statusFilter ? { status: statusFilter, limit: 200 } : { limit: 200 };
  const { data: bookings = [], isLoading } = useListAdminBookings(params, {
    query: { queryKey: getListAdminBookingsQueryKey(params) },
  });
  return (
    <Card className="rounded-[20px] border-[1.5px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="font-serif text-lg font-semibold">Alle Buchungen</CardTitle>
          <div className="flex gap-1.5">
            {([undefined, "pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
              <button
                key={s ?? "all"}
                onClick={() => setStatusFilter(s)}
                className={`px-3 h-7 rounded-full text-xs font-medium border-[1.5px] ${
                  statusFilter === s ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border"
                }`}
                data-testid={`button-bookings-filter-${s ?? "all"}`}
              >{s ? STATUS_LABELS[s] : "Alle"}</button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Keine Buchungen gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Datum</th>
                  <th className="py-2 pr-3">Kunde</th>
                  <th className="py-2 pr-3">Anbieter</th>
                  <th className="py-2 pr-3">Leistung</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Zahlung</th>
                  <th className="py-2 pr-3 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((b) => (
                  <tr key={b.id} data-testid={`row-admin-booking-${b.id}`}>
                    <td className="py-2 pr-3 font-mono text-xs">#{b.id}</td>
                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{dt(b.scheduledAt)}</td>
                    <td className="py-2 pr-3">{b.customerName ?? <span className="text-muted-foreground">{b.customerEmail ?? "—"}</span>}</td>
                    <td className="py-2 pr-3">{b.providerName}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{b.serviceName}</td>
                    <td className="py-2 pr-3"><StatusBadge status={b.status} /></td>
                    <td className="py-2 pr-3"><PaymentBadge status={b.paymentStatus} /></td>
                    <td className="py-2 pr-3 text-right font-medium">{eurEuros(b.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProvidersPanel() {
  const [q, setQ] = useState("");
  const { data: providers = [], isLoading } = useListAdminProviders({
    query: { queryKey: getListAdminProvidersQueryKey() },
  });
  const filtered = q
    ? providers.filter((p) => `${p.displayName} ${p.email} ${p.city} ${p.category}`.toLowerCase().includes(q.toLowerCase()))
    : providers;
  return (
    <Card className="rounded-[20px] border-[1.5px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="font-serif text-lg font-semibold">Anbieter ({providers.length})</CardTitle>
          <Input
            placeholder="Suche nach Name, E-Mail, Stadt…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs h-9"
            data-testid="input-admin-providers-search"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Anbieter</th>
                  <th className="py-2 pr-3">Kategorie</th>
                  <th className="py-2 pr-3">Stadt</th>
                  <th className="py-2 pr-3">Tarif</th>
                  <th className="py-2 pr-3 text-right">Buchungen</th>
                  <th className="py-2 pr-3 text-right">Kunden</th>
                  <th className="py-2 pr-3 text-right">Bewertung</th>
                  <th className="py-2 pr-3 text-right">Umsatz (bez.)</th>
                  <th className="py-2 pr-3">Seit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} data-testid={`row-admin-provider-${p.id}`}>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{p.displayName}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{p.category}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{p.city}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1.5">
                        {p.subscriptionTier === "premium" ? (
                          <Badge className="bg-amber-100 text-amber-900 border-0 gap-1"><Crown className="h-3 w-3" /> Premium</Badge>
                        ) : (
                          <Badge variant="outline">Basic</Badge>
                        )}
                        {p.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">{p.bookingCount}</td>
                    <td className="py-2 pr-3 text-right font-mono">{p.distinctCustomers}</td>
                    <td className="py-2 pr-3 text-right text-muted-foreground">
                      {p.reviewCount > 0 ? `${p.rating.toFixed(1)} (${p.reviewCount})` : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right font-medium">{eur(p.paidRevenueCents)}</td>
                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{d(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomersPanel() {
  const [q, setQ] = useState("");
  const { data: customers = [], isLoading } = useListAdminCustomers({
    query: { queryKey: getListAdminCustomersQueryKey() },
  });
  const filtered = q
    ? customers.filter((c) => `${c.customerName ?? ""} ${c.customerEmail ?? ""} ${c.customerId}`.toLowerCase().includes(q.toLowerCase()))
    : customers;
  return (
    <Card className="rounded-[20px] border-[1.5px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="font-serif text-lg font-semibold">Kunden ({customers.length})</CardTitle>
          <Input
            placeholder="Suche nach Name oder E-Mail…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs h-9"
            data-testid="input-admin-customers-search"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Kunde</th>
                  <th className="py-2 pr-3 text-right">Buchungen</th>
                  <th className="py-2 pr-3 text-right">Bezahlt</th>
                  <th className="py-2 pr-3 text-right">Ausgaben</th>
                  <th className="py-2 pr-3">Erste Buchung</th>
                  <th className="py-2 pr-3">Letzte Buchung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.customerId} data-testid={`row-admin-customer-${c.customerId}`}>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{c.customerName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{c.customerEmail ?? c.customerId}</div>
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">{c.bookingCount}</td>
                    <td className="py-2 pr-3 text-right font-mono text-muted-foreground">{c.paidCount}</td>
                    <td className="py-2 pr-3 text-right font-medium">{eur(c.totalSpentCents)}</td>
                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{d(c.firstBooking)}</td>
                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{d(c.lastBooking)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoriesPanel() {
  const { data: cats = [], isLoading } = useListAdminCategories({
    query: { queryKey: getListAdminCategoriesQueryKey() },
  });
  const maxBookings = Math.max(1, ...cats.map((c) => c.bookingCount));
  return (
    <Card className="rounded-[20px] border-[1.5px]">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg font-semibold">Kategorien</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : (
          <ul className="space-y-2">
            {cats.map((c) => (
              <li key={c.slug} className="rounded-lg border border-border p-3" data-testid={`row-admin-category-${c.slug}`}>
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {c.name}
                    {c.requiresDirectBilling && (
                      <Badge variant="outline" className="text-[10px]">Direktabrechnung</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-4">
                    <span>{c.providerCount} Anbieter</span>
                    <span>{c.bookingCount} Buchungen</span>
                    <span className="font-medium text-foreground">{eur(c.paidRevenueCents)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-[var(--klard-teal)]"
                    style={{ width: `${(c.bookingCount / maxBookings) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
