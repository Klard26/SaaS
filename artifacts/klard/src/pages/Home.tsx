import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useListCategories, useListProviders, useGetPlatformStats } from "@workspace/api-client-react";
import {
  Search, MapPin, Briefcase, Star, CheckCircle, Crown,
  CalendarCheck, UserPlus, ShieldCheck,
  Calculator, Zap, Scale, TrendingUp, Home as HomeIcon, Monitor,
  Megaphone, Users, Shield, Building, Target, FileSignature, ClipboardCheck,
  Compass, Rocket, Coins, Newspaper, Laptop, Lock, ShieldCheck as ShieldCheck2,
  UserCheck, Sparkles, Handshake, Brain, Apple, HeartPulse, Leaf, Ruler,
  SearchCheck, Scroll, Truck, GitMerge, Lightbulb, Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  calculator: Calculator, zap: Zap, briefcase: Briefcase, scale: Scale,
  "trending-up": TrendingUp, home: HomeIcon, monitor: Monitor, megaphone: Megaphone,
  users: Users, shield: Shield, building: Building, target: Target,
  "file-signature": FileSignature, "clipboard-check": ClipboardCheck,
  compass: Compass, rocket: Rocket, coins: Coins, search: Search,
  newspaper: Newspaper, laptop: Laptop, lock: Lock, "shield-check": ShieldCheck2,
  "user-check": UserCheck, sparkles: Sparkles, handshake: Handshake, brain: Brain,
  apple: Apple, "heart-pulse": HeartPulse, leaf: Leaf, ruler: Ruler,
  "search-check": SearchCheck, scroll: Scroll, truck: Truck, "git-merge": GitMerge,
  lightbulb: Lightbulb, receipt: Receipt,
};

export default function Home() {
  const [branche, setBranche] = useState("");
  const [plz, setPlz] = useState("");
  const [leistung, setLeistung] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { data: categories = [] } = useListCategories();
  const { data: providers = [] } = useListProviders({ limit: 6 });
  const { data: stats } = useGetPlatformStats();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (leistung.trim()) params.set("q", leistung.trim());
    if (branche) params.set("category", branche);
    if (plz.trim()) params.set("city", plz.trim());
    setLocation(params.toString() ? `/search?${params.toString()}` : "/search");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* HERO */}
      <section className="klard-hero px-4 sm:px-8 pt-16 pb-20 md:pt-20 md:pb-24 text-center">
        <div className="max-w-[1100px] mx-auto">
          <div className="klard-tag mb-6">
            <span className="dot" />
            Klare Preise für alle Berater in Deutschland
          </div>

          <h1 className="font-serif text-white text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.1] tracking-[-0.5px] mb-4">
            Den richtigen Berater finden.
            <br />
            <em className="italic font-semibold">Preis sehen. Sofort buchen.</em>
          </h1>

          <p className="text-white/75 text-base md:text-[1rem] font-light leading-[1.75] max-w-[560px] mx-auto mb-10">
            Energieberater, Architekten, Statiker, Bauberater und weitere Bau- &
            Energieexperten – echte Festpreise, verifizierte Profile, Direktbuchung wie beim Arzt.
          </p>

          {/* 3-field hero search */}
          <form
            onSubmit={handleSearch}
            className="klard-search max-w-[820px] mx-auto flex-col md:flex-row"
          >
            <div className="klard-search-group">
              <span className="klard-search-lbl">Branche</span>
              <select
                value={branche}
                onChange={e => setBranche(e.target.value)}
                data-testid="select-hero-branche"
              >
                <option value="">Alle Branchen</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="klard-search-group">
              <span className="klard-search-lbl">PLZ oder Ort</span>
              <input
                type="text"
                value={plz}
                onChange={e => setPlz(e.target.value)}
                placeholder="z.B. 10115 Berlin"
                data-testid="input-hero-plz"
              />
            </div>
            <div className="klard-search-group">
              <span className="klard-search-lbl">Leistung</span>
              <input
                type="text"
                value={leistung}
                onChange={e => setLeistung(e.target.value)}
                placeholder="z.B. Steuererklärung"
                data-testid="input-hero-leistung"
              />
            </div>
            <button type="submit" className="klard-search-btn" data-testid="button-hero-search">
              <Search className="h-4 w-4" />
              Suchen
            </button>
          </form>

          {/* HERO STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 max-w-[760px] mx-auto mt-12">
            <Stat n={stats?.totalProviders ? `${stats.totalProviders.toLocaleString("de")}+` : "2.400+"} l="Geprüfte Anbieter" />
            <Stat n={stats?.totalCategories ? `${stats.totalCategories}` : "47"} l="Branchen" />
            <Stat n="∅ 23%" l="Kundensparnis" />
            <Stat n="30 Sek." l="KI-Angebot" />
          </div>
        </div>
      </section>

      {/* CATEGORY PILL BAR */}
      <div className="bg-white border-b border-border px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto flex gap-2 overflow-x-auto py-3 no-scrollbar">
          <button
            type="button"
            onClick={() => { setActiveCat(null); setLocation("/search"); }}
            className={`klard-cpill ${activeCat === null ? "active" : ""}`}
            data-testid="cpill-all"
          >
            Alle Branchen
          </button>
          {categories.map(c => {
            const Icon = ICONS[c.icon] ?? Briefcase;
            const isActive = activeCat === c.slug;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { setActiveCat(c.slug); setLocation(`/search?category=${c.slug}`); }}
                className={`klard-cpill ${isActive ? "active" : ""}`}
                data-testid={`cpill-${c.slug}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP-BERATER */}
      <section className="bg-[var(--klard-bg)] py-14 px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)] text-[0.7rem] font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-3">
              Empfohlen
            </span>
            <h2 className="font-serif text-3xl font-semibold text-foreground">Top-Berater dieser Woche</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Verifizierte Profile mit den besten Bewertungen und schnellsten Reaktionszeiten.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.slice(0, 6).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLocation(`/providers/${p.id}`)}
                className="text-left bg-white border-[1.5px] border-border rounded-[20px] p-5 shadow-sm hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                data-testid={`card-provider-${p.id}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-sans font-bold text-base text-foreground truncate">{p.displayName}</h3>
                      {p.verified && (
                        <span className="inline-flex items-center gap-1 bg-[var(--klard-green-l)] text-[var(--klard-green)] text-[0.66rem] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-2.5 w-2.5" /> Verifiziert
                        </span>
                      )}
                      {p.subscriptionTier === "premium" && (
                        <span className="inline-flex items-center gap-1 bg-[var(--klard-gold-l)] text-[var(--klard-gold)] text-[0.66rem] font-bold px-2 py-0.5 rounded-full">
                          <Crown className="h-2.5 w-2.5" /> Premium
                        </span>
                      )}
                    </div>
                    <p className="text-[0.76rem] text-muted-foreground">
                      {p.category} · {p.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="text-sm font-bold text-foreground">{p.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
                  </div>
                </div>

                {p.bio && (
                  <p className="text-[0.83rem] text-[var(--klard-mid)] line-clamp-2 mb-4 leading-relaxed">{p.bio}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-foreground">
                    {p.minPrice == null ? (
                      <span className="text-muted-foreground">Preis auf Anfrage</span>
                    ) : (
                      <>
                        ab{" "}
                        <strong className="font-serif text-base text-[var(--klard-teal-d)]">
                          {p.minPrice === 0 ? "kostenlos" : `${p.minPrice} €`}
                        </strong>
                      </>
                    )}
                  </span>
                  <span className="text-xs font-semibold text-primary">Profil ansehen →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-t border-border py-16 px-4 sm:px-8">
        <div className="text-center mb-12">
          <span className="inline-block bg-[var(--klard-teal-l)] text-[var(--klard-teal-d)] text-[0.7rem] font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-3">
            So funktioniert Klard
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            Buchen wie beim Arzt – für alle Berater
          </h2>
          <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto leading-relaxed">
            Kein Anruf. Kein Warten auf Angebote. Einfach suchen, vergleichen und direkt buchen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1000px] mx-auto">
          {[
            { n: "1", title: "Suchen & vergleichen", desc: "PLZ eingeben, Branche wählen, Preise sofort sehen. Kein Anruf nötig." },
            { n: "2", title: "Termin wählen", desc: "Freie Slots direkt im Live-Kalender sehen und sofort reservieren." },
            { n: "3", title: "Schnell registrieren", desc: "Name + E-Mail – fertig in 30 Sekunden. Keine Legitimierung." },
            { n: "4", title: "Verbindlich buchen", desc: "Zahlung, Bestätigung und Rechnung – alles automatisch." },
          ].map(s => (
            <div key={s.n} className="text-center">
              <div className="klard-step-n mx-auto mb-4">{s.n}</div>
              <h4 className="font-sans font-bold text-base text-foreground mb-2">{s.title}</h4>
              <p className="text-[0.83rem] text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST / CTA STRIP */}
      <section className="bg-[var(--klard-teal-p)] border-y border-[var(--klard-teal-l)] py-12 px-4 sm:px-8">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex md:flex-row flex-col items-center md:items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-white border border-[var(--klard-teal-l)] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-[var(--klard-teal-d)]" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm text-foreground mb-1">Verifizierte Berater</h4>
              <p className="text-xs text-[var(--klard-mid)] leading-relaxed">Jeder Anbieter wird vor Freischaltung manuell geprüft.</p>
            </div>
          </div>
          <div className="flex md:flex-row flex-col items-center md:items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-white border border-[var(--klard-teal-l)] flex items-center justify-center shrink-0">
              <CalendarCheck className="h-5 w-5 text-[var(--klard-teal-d)]" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm text-foreground mb-1">Live-Kalender</h4>
              <p className="text-xs text-[var(--klard-mid)] leading-relaxed">Verfügbare Termine in Echtzeit – inkl. iCal-Sync.</p>
            </div>
          </div>
          <div className="flex md:flex-row flex-col items-center md:items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-white border border-[var(--klard-teal-l)] flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5 text-[var(--klard-teal-d)]" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm text-foreground mb-1">Anbieter werden</h4>
              <p className="text-xs text-[var(--klard-mid)] leading-relaxed">
                Kostenlos starten – nur 9 % Vermittlungsgebühr.{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/provider/onboarding")}
                  className="text-primary font-semibold hover:underline"
                  data-testid="link-become-provider"
                >
                  Jetzt registrieren →
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <span className="block font-serif font-semibold text-white text-[2rem] leading-none">{n}</span>
      <span className="block text-white/60 text-[0.72rem] mt-1.5 tracking-wide">{l}</span>
    </div>
  );
}
