import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import {
  useGetMyProviderProfile, getGetMyProviderProfileQueryKey,
  useGetMySubscription, getGetMySubscriptionQueryKey,
  useCreateSubscriptionCheckout,
} from "@workspace/api-client-react";
import { Check, Sparkles, ArrowRight, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { readRememberedWorld, type ProviderWorld } from "@/lib/providerWorld";

// World-aware monetization. Each world has booking categories (percentage
// commission per booking) AND lead categories (pay-per-lead fee per request).
// Commission rates and lead prices differ by world.
const COMMISSION = {
  pro: { basic: 14, premium: 9 },
  alltag: { basic: 15, premium: 10 },
} as const;

const PREMIUM_PRICE: Record<ProviderWorld, number> = { pro: 89, alltag: 69 };

function basicFeatures(world: ProviderWorld): string[] {
  const base = [
    "Berater-Profil mit Bio & Foto",
    "Bis zu 3 Leistungen anbieten",
    "Live-Verfügbarkeitskalender",
    "Bewertungen sammeln",
  ];
  if (world === "alltag") {
    return [
      ...base,
      "Buchungen über Klard entgegennehmen",
      `Klard-Provision: ${COMMISSION.alltag.basic} % je Buchung (Buchungs-Kategorien)`,
      "Pay-per-Lead: 6–15 € je Anfrage (Lead-Kategorien)",
    ];
  }
  return [
    ...base,
    "Buchungen über Klard entgegennehmen",
    `Klard-Provision: ${COMMISSION.pro.basic} % je Buchung (Buchungs-Kategorien)`,
    "Pay-per-Lead: 15 € je Anfrage (Lead-Kategorien)",
  ];
}

function premiumFeatures(world: ProviderWorld): string[] {
  const head = [
    "Alles aus Basic",
    "Unbegrenzte Leistungen",
    "Hervorgehoben in der Suche (Top-Berater)",
    "Premium-Badge auf Profil & Suche",
    "Priorisierte Anzeige je Branche & Stadt",
    "AI-Angebotsgenerator (Claude)",
    "Kalendersynchronisierung (iCal-Feed)",
    "Detaillierte Statistiken & Insights",
  ];
  const tail = [
    "E-Mail-Vorlagen für Mandantenkommunikation",
    "Vorrangiger Support",
  ];
  if (world === "alltag") {
    return [
      ...head,
      `Reduzierte Klard-Provision: ${COMMISSION.alltag.premium} % (statt ${COMMISSION.alltag.basic} %)`,
      ...tail,
    ];
  }
  return [
    ...head,
    `Reduzierte Klard-Provision: ${COMMISSION.pro.premium} % (statt ${COMMISSION.pro.basic} %)`,
    ...tail,
  ];
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();
  const { toast } = useToast();

  const { data: profile } = useGetMyProviderProfile({
    query: { enabled: !!isSignedIn, queryKey: getGetMyProviderProfileQueryKey() },
  });
  const { data: sub } = useGetMySubscription({
    query: { enabled: !!profile, queryKey: getGetMySubscriptionQueryKey() },
  });
  const checkout = useCreateSubscriptionCheckout();

  const world: ProviderWorld = sub?.world ?? readRememberedWorld() ?? "pro";
  const basicFeats = basicFeatures(world);
  const premiumFeats = premiumFeatures(world);
  const isPremium = sub?.tier === "premium";
  const priceEur = sub?.priceEur ?? PREMIUM_PRICE[world];

  async function handleUpgrade() {
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    if (!profile) {
      setLocation("/provider/onboarding");
      return;
    }
    try {
      const result = await checkout.mutateAsync();
      if (result?.url) window.location.href = result.url;
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      toast({
        title: "Premium ist noch nicht aktiviert",
        description:
          msg.includes("Stripe") || msg.includes("503")
            ? "Stripe-Zahlungen sind noch nicht eingerichtet. Bitte aktivieren Sie die Stripe-Integration."
            : "Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
            Klard Business
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Gewinnen Sie planbar neue Mandanten
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Starten Sie kostenlos. Upgraden Sie zu Premium für mehr Sichtbarkeit, AI-Tools und reduzierte Provision.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Basic
                {!isPremium && profile && <Badge variant="secondary">Aktueller Tarif</Badge>}
              </CardTitle>
              <div className="mt-3">
                <span className="text-4xl font-bold">0 €</span>
                <span className="text-muted-foreground ml-1.5">/ Monat</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Für Einsteiger. Sie zahlen nur, wenn Sie Mandanten gewinnen.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {basicFeats.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              {!profile && (
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => setLocation("/provider/onboarding")}
                  data-testid="button-start-basic"
                >
                  Kostenlos starten
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className="relative border-primary/40 bg-gradient-to-br from-primary/5 to-transparent shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                <Crown className="h-3 w-3 mr-1" /> Empfohlen
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Premium
                {isPremium && <Badge>Aktueller Tarif</Badge>}
              </CardTitle>
              <div className="mt-3">
                <span className="text-4xl font-bold text-primary">{priceEur} €</span>
                <span className="text-muted-foreground ml-1.5">/ Monat</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Maximale Sichtbarkeit, AI-Tools und reduzierte Klard-Provision.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {premiumFeats.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-6 gap-1.5"
                onClick={handleUpgrade}
                disabled={isPremium || checkout.isPending}
                data-testid="button-upgrade-premium"
              >
                {isPremium ? "Bereits Premium" : checkout.isPending ? "Wird geladen..." : "Premium starten"}
                {!isPremium && <ArrowRight className="h-4 w-4" />}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Monatlich kündbar. Sichere Zahlung über Stripe.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            {world === "alltag"
              ? "Klard Alltag & Handwerk verbindet Sie mit Kund:innen für Haushalt, Garten, Renovierung, Pflege und mehr."
              : "Klard ist auf die Bau- und Energiebranche fokussiert: Energieberatung, Architektur, Tragwerksplanung, Bauberatung, Sachverständige, Vermessung, TGA-Fachplanung und Bauphysik."}
          </p>
        </div>
      </div>
    </div>
  );
}
