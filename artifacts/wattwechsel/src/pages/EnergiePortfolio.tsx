import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap } from "lucide-react";
import {
  useGetMyVerwalter,
  getGetMyVerwalterQueryKey,
  useGetEnergiePortfolio,
  getGetEnergiePortfolioQueryKey,
} from "@workspace/api-client-react";
import { VERWALTER_TYP_LABELS, type VerwalterTyp } from "@workspace/energie-wechsel";
import { UebersichtTab } from "@/components/energie/UebersichtTab";
import { PortfolioTab } from "@/components/energie/PortfolioTab";
import { VollmachtenTab } from "@/components/energie/VollmachtenTab";
import { WechselTab } from "@/components/energie/WechselTab";
import { AuditTab } from "@/components/energie/AuditTab";
import { TarifeTab } from "@/components/energie/TarifeTab";

export default function EnergiePortfolio() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("uebersicht");

  const { data: verwalter, isLoading: verwalterLoading } = useGetMyVerwalter({
    query: { queryKey: getGetMyVerwalterQueryKey() },
  });

  const { data: portfolio, isLoading: portfolioLoading } = useGetEnergiePortfolio({
    query: { queryKey: getGetEnergiePortfolioQueryKey(), enabled: !!verwalter },
  });

  useEffect(() => {
    if (!verwalterLoading && !verwalter) setLocation("/onboarding");
  }, [verwalterLoading, verwalter, setLocation]);

  if (verwalterLoading || !verwalter) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  const objekte = portfolio?.objekte ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--klard-green-l)]">
              <Zap className="h-5 w-5 text-[var(--klard-green)]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-firma">{verwalter.firma}</h1>
              <p className="text-sm text-muted-foreground">
                enerwatt24 Cockpit ·{" "}
                {VERWALTER_TYP_LABELS[verwalter.typ as VerwalterTyp] ?? verwalter.typ}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-[var(--klard-green)] text-[var(--klard-green)]">
            Neutral &amp; provisionsfrei
          </Badge>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="uebersicht" data-testid="tab-uebersicht">Übersicht</TabsTrigger>
            <TabsTrigger value="portfolio" data-testid="tab-portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="vollmachten" data-testid="tab-vollmachten">Vollmachten</TabsTrigger>
            <TabsTrigger value="wechsel" data-testid="tab-wechsel">Wechsel</TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">Audit</TabsTrigger>
            <TabsTrigger value="tarife" data-testid="tab-tarife">Tarife</TabsTrigger>
          </TabsList>

          <TabsContent value="uebersicht" className="mt-6">
            {portfolioLoading ? (
              <CenterSpinner />
            ) : (
              <UebersichtTab kpi={portfolio?.kpi} onNavigate={setTab} />
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            {portfolioLoading ? <CenterSpinner /> : <PortfolioTab objekte={objekte} />}
          </TabsContent>

          <TabsContent value="vollmachten" className="mt-6">
            <VollmachtenTab objekte={objekte} />
          </TabsContent>

          <TabsContent value="wechsel" className="mt-6">
            <WechselTab objekte={objekte} />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditTab />
          </TabsContent>

          <TabsContent value="tarife" className="mt-6">
            <TarifeTab />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

function CenterSpinner() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-muted-foreground">Lädt…</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
