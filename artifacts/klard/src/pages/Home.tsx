import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useListCategories, useListProviders, useGetPlatformStats } from "@workspace/api-client-react";
import { Star, ArrowRight, CheckCircle, Clock, Shield, Search } from "lucide-react";

const ICONS: Record<string, string> = {
  calculator: "🧮", zap: "⚡", briefcase: "💼", scale: "⚖️", "trending-up": "📈",
  home: "🏠", monitor: "🖥️", megaphone: "📢", users: "👥", shield: "🛡️",
  building: "🏢", target: "🎯",
};

export default function Home() {
  const [q, setQ] = useState("");
  const [, setLocation] = useLocation();

  const { data: categories = [] } = useListCategories();
  const { data: providers = [] } = useListProviders({ limit: 6 });
  const { data: stats } = useGetPlatformStats();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) setLocation(`/search?q=${encodeURIComponent(q.trim())}`);
    else setLocation("/search");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="outline" className="mb-6 px-3 py-1 text-xs font-medium tracking-wide">
            Die Nr. 1 Plattform fur Berater-Buchungen in Deutschland
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            Buchen Sie den richtigen<br className="hidden md:block" />
            <span className="text-primary"> Berater</span> in 30 Sekunden
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Sofort Verfugbarkeit sehen, Preise vergleichen, und Termine buchen — ohne Telefonkette, ohne Wartezeiten.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Steuerberater, Energieberater, Anwalt..."
                className="pl-9 h-12 text-base"
                value={q}
                onChange={e => setQ(e.target.value)}
                data-testid="input-search-home"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 shrink-0" data-testid="button-search-home">
              Berater finden
            </Button>
          </form>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="border-y border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{stats.totalProviders?.toLocaleString("de")}</p>
              <p className="text-sm text-muted-foreground mt-1">Verifizierte Berater</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.totalBookings?.toLocaleString("de")}</p>
              <p className="text-sm text-muted-foreground mt-1">Abgeschlossene Buchungen</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.totalCategories}</p>
              <p className="text-sm text-muted-foreground mt-1">Fachbereiche</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">4.8</p>
              <p className="text-sm text-muted-foreground mt-1">Durchschnittsbewertung</p>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Fachbereiche</h2>
            <p className="text-muted-foreground mt-1">Alle Beratungsfelder auf einen Blick</p>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/search")} className="hidden sm:flex gap-1" data-testid="button-all-categories">
            Alle anzeigen <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setLocation(`/search?category=${cat.slug}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group text-left"
              data-testid={`card-category-${cat.id}`}
            >
              <span className="text-2xl">{ICONS[cat.icon] ?? "📋"}</span>
              <span className="text-xs font-medium text-center text-foreground leading-tight">{cat.name}</span>
              {cat.providerCount !== undefined && (
                <span className="text-xs text-muted-foreground">{cat.providerCount} Berater</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Providers */}
      <section className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Top-Berater</h2>
              <p className="text-muted-foreground mt-1">Herausragende Berater auf unserer Plattform</p>
            </div>
            <Button variant="ghost" onClick={() => setLocation("/search")} className="hidden sm:flex gap-1" data-testid="button-all-providers">
              Alle anzeigen <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.slice(0, 6).map(provider => (
              <Card
                key={provider.id}
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setLocation(`/providers/${provider.id}`)}
                data-testid={`card-provider-${provider.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{provider.displayName}</h3>
                        {provider.verified && (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{provider.category} · {provider.city}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({provider.reviewCount})</span>
                    </div>
                  </div>
                  {provider.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{provider.bio}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      ab <strong>{provider.minPrice === 0 ? "kostenlos" : `${provider.minPrice} €`}</strong>
                    </span>
                    <Button size="sm" variant="outline" data-testid={`button-provider-detail-${provider.id}`}>
                      Profil ansehen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">So funktioniert Klard</h2>
          <p className="text-muted-foreground">In drei Schritten zum richtigen Berater</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { icon: Search, step: "1", title: "Berater suchen", desc: "Geben Sie Ihre PLZ oder Stadt ein und wahlen Sie einen Fachbereich. Vergleichen Sie Profile, Preise und Bewertungen." },
            { icon: Clock, step: "2", title: "Termin buchen", desc: "Sehen Sie die Echtzeit-Verfugbarkeit und buchen Sie sofort Ihren Wunschtermin — ohne Telefonkette." },
            { icon: Shield, step: "3", title: "Sicher beraten lassen", desc: "Alle Berater sind verifiziert. Bezahlen Sie sicher nach der Beratung und hinterlassen Sie eine Bewertung." },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <Icon className="h-6 w-6 text-primary" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {step}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Sind Sie Berater?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Registrieren Sie sich kostenlos und erhalten Sie neue Mandanten uber Klard. Verwalten Sie Termine, Preise und Verfugbarkeit in einem Dashboard.
          </p>
          <Button size="lg" variant="secondary" onClick={() => setLocation("/provider/onboarding")} data-testid="button-provider-cta">
            Jetzt als Berater starten
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Klard</span>
          <span>&copy; {new Date().getFullYear()} Klard. Alle Rechte vorbehalten.</span>
        </div>
      </footer>
    </div>
  );
}
