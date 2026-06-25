import { useEffect, useState } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyProviderProfile,
  useGetMyWallet,
  useCreateWalletTopup,
  getGetMyWalletQueryKey,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/journey/EmptyState";
import { PremiumBadge, BasicBadge } from "@/components/journey/Badges";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Loader2, ArrowUpCircle, ArrowDownCircle, RotateCcw } from "lucide-react";

const eur = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const PRESET_EUR = [25, 50, 100, 250];

const TX_LABELS: Record<string, string> = {
  topup: "Aufladung",
  lead_fee: "Lead-Gebühr",
  refund: "Erstattung",
  adjustment: "Anpassung",
};

export default function ProviderWallet() {
  const { data: profile, isLoading: profileLoading } = useGetMyProviderProfile();
  const providerReady = !!profile;

  const { toast } = useToast();
  const qc = useQueryClient();
  const search = useSearch();
  const [, setLocation] = useLocation();

  const walletQuery = useGetMyWallet({ query: { enabled: providerReady, queryKey: getGetMyWalletQueryKey() } });
  const topup = useCreateWalletTopup();

  const [amountEur, setAmountEur] = useState<string>("50");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const status = params.get("topup");
    if (status === "success") {
      qc.invalidateQueries({ queryKey: getGetMyWalletQueryKey() });
      toast({
        title: "Aufladung erfolgreich",
        description: "Ihr Lead-Guthaben wurde aktualisiert.",
      });
      setLocation("/wallet");
    } else if (status === "cancel") {
      toast({ title: "Aufladung abgebrochen", description: "Es wurde nichts abgebucht." });
      setLocation("/wallet");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleTopup(eurAmount: number) {
    const cents = Math.round(eurAmount * 100);
    if (cents < 500 || cents > 100000) {
      toast({
        title: "Ungültiger Betrag",
        description: "Bitte wählen Sie zwischen 5 € und 1.000 €.",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await topup.mutateAsync({ data: { amountCents: cents } });
      window.location.href = result.url;
    } catch {
      toast({
        title: "Fehler",
        description: "Die Aufladung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  }

  const wallet = walletQuery.data;
  const entitlements = wallet?.entitlements;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--klard-bg)]">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Lead-Guthaben</h1>
          <p className="text-muted-foreground mt-1">
            Mit Guthaben senden Sie Angebote auf Kundenanfragen. Pro Angebot wird eine Lead-Gebühr fällig.
          </p>
        </div>

        {!providerReady ? (
          profileLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <EmptyState
              icon={Wallet}
              title="Profil erforderlich"
              description="Legen Sie zuerst Ihr Berater-Profil an, um Ihr Lead-Guthaben zu verwalten."
            >
              <Link href="/provider/onboarding">
                <Button data-testid="button-onboarding">Profil erstellen</Button>
              </Link>
            </EmptyState>
          )
        ) : walletQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktuelles Guthaben</p>
                    <p className="text-4xl font-bold text-foreground" data-testid="text-wallet-balance">
                      {eur(wallet?.balanceCents ?? 0)}
                    </p>
                  </div>
                  {entitlements &&
                    (entitlements.tier === "premium" ? <PremiumBadge size="md" /> : <BasicBadge size="md" />)}
                </div>

                {entitlements && (
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Leads diesen Monat</p>
                      <p className="font-semibold text-foreground">
                        {entitlements.leadsUsed}
                        {entitlements.maxLeadsMonth != null ? ` / ${entitlements.maxLeadsMonth}` : " / ∞"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kostenlose Leads</p>
                      <p className="font-semibold text-foreground" data-testid="text-free-leads">
                        {entitlements.freeLeadsRemaining}
                      </p>
                    </div>
                    {entitlements.leadDiscountPct > 0 && (
                      <div>
                        <p className="text-muted-foreground">Lead-Rabatt</p>
                        <p className="font-semibold text-foreground">
                          {Math.round(entitlements.leadDiscountPct * 100)} %
                        </p>
                      </div>
                    )}
                    {entitlements.tier === "basic" && (
                      <div className="col-span-2 sm:col-span-1 flex items-end">
                        <Link href="/pricing">
                          <Button variant="outline" size="sm" data-testid="button-upgrade-premium">
                            Premium: unbegrenzte Leads
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guthaben aufladen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {PRESET_EUR.map((p) => (
                    <Button
                      key={p}
                      variant="outline"
                      onClick={() => handleTopup(p)}
                      disabled={topup.isPending}
                      data-testid={`button-topup-${p}`}
                    >
                      {p} €
                    </Button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground" htmlFor="topup-amount">
                      Eigener Betrag (€)
                    </label>
                    <Input
                      id="topup-amount"
                      type="number"
                      min={5}
                      max={1000}
                      value={amountEur}
                      onChange={(e) => setAmountEur(e.target.value)}
                      data-testid="input-topup-amount"
                    />
                  </div>
                  <Button
                    onClick={() => handleTopup(Number(amountEur))}
                    disabled={topup.isPending || !amountEur}
                    data-testid="button-topup-custom"
                  >
                    {topup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Aufladen
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Zahlung sicher über Stripe. Mindestbetrag 5 €, maximal 1.000 €.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaktionen</CardTitle>
              </CardHeader>
              <CardContent>
                {!wallet || wallet.transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Noch keine Transaktionen.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallet.transactions.map((tx) => {
                        const positive = tx.amountCents >= 0;
                        const Icon =
                          tx.type === "refund"
                            ? RotateCcw
                            : positive
                              ? ArrowUpCircle
                              : ArrowDownCircle;
                        return (
                          <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                            <TableCell className="text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString("de-DE")}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5">
                                <Icon
                                  className={`h-4 w-4 ${positive ? "text-primary" : "text-muted-foreground"}`}
                                />
                                {TX_LABELS[tx.type] ?? tx.type}
                              </span>
                              {tx.note && (
                                <span className="block text-xs text-muted-foreground">{tx.note}</span>
                              )}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${positive ? "text-primary" : "text-foreground"}`}
                            >
                              {positive ? "+" : "−"}
                              {eur(Math.abs(tx.amountCents))}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {eur(tx.balanceAfterCents)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
