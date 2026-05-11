import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { useListProviders, useListCategories, getListProvidersQueryKey } from "@workspace/api-client-react";
import {
  Search, MapPin, CheckCircle, Crown, Briefcase, Star, X,
  ShieldCheck, Trophy, Calendar,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Footer } from "@/components/Footer";
import { publicUrlForObjectPath } from "@/lib/upload";
import { formatPriceEUR } from "@/lib/dateFmt";

type ChipKey = "rating45" | "verified" | "top"
  | "exp1to5" | "exp5to10" | "exp10to20" | "exp20plus";

export default function SearchPage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const [radius, setRadius] = useState("25");
  const [sortBy, setSortBy] = useState<"recommended" | "price-asc" | "rating-desc">("recommended");
  const [chips, setChips] = useState<Set<ChipKey>>(new Set());

  const queryParams = {
    ...(q ? { q } : {}),
    ...(city ? { city } : {}),
    ...(category && category !== "all" ? { category } : {}),
    ...(minPrice ? { minPrice: Number(minPrice) } : {}),
    ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
    limit: 50,
  };

  const { data: providersRaw = [], isLoading } = useListProviders(queryParams);
  const { data: categories = [] } = useListCategories();

  // Client-side chip filters (visual feedback for filters not yet supported by backend)
  let providers = [...providersRaw];
  if (chips.has("rating45")) providers = providers.filter(p => p.rating >= 4.5);
  if (chips.has("verified")) providers = providers.filter(p => p.verified);
  if (chips.has("top")) providers = providers.filter(p => p.subscriptionTier === "premium");
  if (chips.has("exp1to5")) providers = providers.filter(p => (p.yearsExperience ?? 0) >= 1 && (p.yearsExperience ?? 0) < 5);
  if (chips.has("exp5to10")) providers = providers.filter(p => (p.yearsExperience ?? 0) >= 5 && (p.yearsExperience ?? 0) < 10);
  if (chips.has("exp10to20")) providers = providers.filter(p => (p.yearsExperience ?? 0) >= 10 && (p.yearsExperience ?? 0) < 20);
  if (chips.has("exp20plus")) providers = providers.filter(p => (p.yearsExperience ?? 0) >= 20);

  if (sortBy === "price-asc") providers.sort((a, b) => (a.minPrice ?? 9e9) - (b.minPrice ?? 9e9));
  else if (sortBy === "rating-desc") providers.sort((a, b) => b.rating - a.rating);

  const activeCategory = categories.find(c => c.slug === category);

  function toggleChip(k: ChipKey) {
    setChips(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function applyTopFilters(e: React.FormEvent) {
    e.preventDefault();
    qc.invalidateQueries({ queryKey: getListProvidersQueryKey(queryParams) });
  }

  function clearAll() {
    setQ(""); setCity(""); setCategory("all");
    setMinPrice(""); setMaxPrice(""); setRadius("25");
    setChips(new Set());
  }

  const hasFilters = q || city || (category && category !== "all") || minPrice || maxPrice || chips.size > 0;

  return (
    <div className="min-h-screen bg-[var(--klard-bg)] flex flex-col">
      <Navbar />

      {/* Top compact search/filter bar */}
      <div className="bg-white border-b border-border">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4">
          <form onSubmit={applyTopFilters} className="klard-search !shadow-none !border !border-border max-w-none">
            <div className="klard-search-group">
              <span className="klard-search-lbl">Branche</span>
              <select value={category} onChange={e => setCategory(e.target.value)} data-testid="select-category-top">
                <option value="all">Alle Branchen</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="klard-search-group">
              <span className="klard-search-lbl">PLZ oder Ort</span>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="z.B. 10115 Berlin"
                data-testid="input-city"
              />
            </div>
            <div className="klard-search-group">
              <span className="klard-search-lbl">Leistung</span>
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="z.B. Steuererklärung"
                data-testid="input-search"
              />
            </div>
            <button type="submit" className="klard-search-btn" data-testid="button-search-submit">
              <Search className="h-4 w-4" />
              Suchen
            </button>
          </form>
        </div>
      </div>

      {/* Main: sidebar + results */}
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 py-7 grid lg:grid-cols-[284px_1fr] gap-6 flex-1">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col gap-3.5 self-start sticky top-[88px]">
          <FCard title="Filter">
            <FieldLabel>PLZ / Ort</FieldLabel>
            <FInput value={city} onChange={setCity} placeholder="10115 Berlin" />

            <FieldLabel className="mt-3">Umkreis</FieldLabel>
            <FSelect value={radius} onChange={setRadius}>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="0">Deutschlandweit</option>
            </FSelect>

            <FieldLabel className="mt-3">Preisbereich (€)</FieldLabel>
            <div className="flex gap-2">
              <FInput
                value={minPrice}
                onChange={setMinPrice}
                placeholder="von"
                type="number"
                className="text-center"
                testId="input-min-price"
              />
              <FInput
                value={maxPrice}
                onChange={setMaxPrice}
                placeholder="bis"
                type="number"
                className="text-center"
                testId="input-max-price"
              />
            </div>
          </FCard>

          <FCard title="Qualität">
            <ChipRow>
              <Chip on={chips.has("rating45")} onClick={() => toggleChip("rating45")}><Star className="h-3 w-3" /> 4.5+</Chip>
              <Chip on={chips.has("verified")} onClick={() => toggleChip("verified")}><ShieldCheck className="h-3 w-3" /> Verifiziert</Chip>
              <Chip on={chips.has("top")} onClick={() => toggleChip("top")}><Trophy className="h-3 w-3" /> Premium</Chip>
            </ChipRow>
          </FCard>

          <FCard title="Berufserfahrung">
            <ChipRow>
              <Chip on={chips.has("exp1to5")} onClick={() => toggleChip("exp1to5")}>1–5 J.</Chip>
              <Chip on={chips.has("exp5to10")} onClick={() => toggleChip("exp5to10")}>5–10 J.</Chip>
              <Chip on={chips.has("exp10to20")} onClick={() => toggleChip("exp10to20")}>10–20 J.</Chip>
              <Chip on={chips.has("exp20plus")} onClick={() => toggleChip("exp20plus")}>20+ J.</Chip>
            </ChipRow>
          </FCard>

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="w-full py-2 px-3 bg-transparent border-[1.5px] border-border rounded-lg text-xs font-semibold text-muted-foreground hover:border-destructive hover:text-destructive transition-colors mt-1 flex items-center justify-center gap-1.5"
              data-testid="button-clear-filters"
            >
              <X className="h-3 w-3" /> Filter zurücksetzen
            </button>
          )}
        </aside>

        {/* RESULTS */}
        <section className="min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl font-bold text-foreground">
              {activeCategory ? activeCategory.name : "Alle Branchen"}
              <span className="font-sans font-normal text-sm text-muted-foreground ml-2">
                {isLoading ? "lädt …" : `– ${providers.length} Anbieter`}
              </span>
            </h2>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white border-[1.5px] border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer hover:border-primary transition-colors"
              data-testid="select-sort"
            >
              <option value="recommended">Empfohlen</option>
              <option value="price-asc">Preis ↑</option>
              <option value="rating-desc">Bewertung ↓</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-[20px]" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="bg-white border border-border rounded-[20px] py-16 px-6 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-foreground">Keine Berater gefunden</p>
              <p className="text-sm mt-1">Versuchen Sie andere Suchbegriffe oder passen Sie die Filter an.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-border px-4 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary transition-colors"
                data-testid="button-clear-search"
              >
                Suche zurücksetzen
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {providers.map(p => (
                <article
                  key={p.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => setLocation(`/providers/${p.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLocation(`/providers/${p.id}`);
                    }
                  }}
                  aria-label={`${p.displayName} – Profil ansehen`}
                  className="grid md:grid-cols-[1fr_220px] grid-cols-1 bg-white border-[1.5px] border-border rounded-[20px] overflow-hidden shadow-sm hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  data-testid={`card-provider-${p.id}`}
                >
                  {/* Main */}
                  <div className="p-5">
                    <div className="flex gap-4 mb-3">
                      <div className="w-14 h-14 rounded-[13px] flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden border border-border bg-gradient-to-br from-[var(--klard-teal-l)] to-[var(--klard-teal-p)] text-[var(--klard-teal-d)]">
                        {p.logoUrl ? (
                          <img
                            src={publicUrlForObjectPath(p.logoUrl)}
                            alt={`Logo ${p.displayName}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          p.displayName.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-sans font-bold text-base text-foreground">{p.displayName}</h3>
                          {p.verified && (
                            <span className="inline-flex items-center gap-1 bg-[var(--klard-green-l)] text-[var(--klard-green)] text-[0.66rem] font-bold px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-2.5 w-2.5" /> Verifiziert
                            </span>
                          )}
                          {p.subscriptionTier === "premium" && (
                            <span className="inline-flex items-center gap-1 bg-[var(--klard-gold-l)] text-[var(--klard-gold)] text-[0.66rem] font-bold px-2 py-0.5 rounded-full">
                              <Crown className="h-2.5 w-2.5" /> Top
                            </span>
                          )}
                        </div>
                        <p className="text-[0.78rem] text-muted-foreground mb-1.5">{p.category}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[#F59E0B] tracking-tighter text-sm" aria-hidden>
                            {"★".repeat(Math.round(p.rating))}{"☆".repeat(5 - Math.round(p.rating))}
                          </span>
                          <span className="text-sm font-bold">{p.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({p.reviewCount} Bewertungen)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.76rem] text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</span>
                      {p.yearsExperience != null && p.yearsExperience > 0 && (
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {p.yearsExperience} J. Erfahrung</span>
                      )}
                    </div>

                    {p.bio && (
                      <p className="text-[0.83rem] text-[var(--klard-mid)] leading-relaxed line-clamp-2">{p.bio}</p>
                    )}
                  </div>

                  {/* Side */}
                  <div className="p-4 md:border-l md:border-t-0 border-t border-border bg-[var(--klard-bg)] flex flex-col gap-3">
                    {p.yearsExperience != null && p.yearsExperience > 0 && (
                      <div className="bg-white border border-border rounded-lg py-2 px-3 text-center">
                        <div className="font-serif text-2xl font-semibold text-[var(--klard-teal-d)] leading-none">{p.yearsExperience}</div>
                        <div className="text-[0.66rem] text-muted-foreground mt-0.5">Jahre Erfahrung</div>
                      </div>
                    )}

                    <div className="text-center mt-auto">
                      <div className="text-[0.7rem] text-muted-foreground">Preis</div>
                      <div className="font-serif text-lg font-semibold text-[var(--klard-teal-d)]">
                        {p.minPrice == null ? "auf Anfrage" : p.minPrice === 0 ? "kostenlos" : `ab ${formatPriceEUR(p.minPrice)}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLocation(`/providers/${p.id}`); }}
                      className="w-full py-2.5 bg-primary hover:bg-[var(--klard-teal-d)] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                      data-testid={`button-book-${p.id}`}
                    >
                      <Calendar className="h-4 w-4" /> Termin buchen
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}

/* ---------- small visual helpers (file-local) ---------- */

function FCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
      <h3 className="text-[0.72rem] font-bold text-[var(--klard-mid)] uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function FieldLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-[0.72rem] font-semibold text-muted-foreground mb-1.5 ${className}`}>{children}</label>;
}

function FInput({
  value, onChange, placeholder, type = "text", className = "", testId,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; className?: string; testId?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testId}
      className={`w-full bg-secondary border-[1.5px] border-transparent text-foreground px-3 py-2 rounded-lg text-sm outline-none transition-all focus:border-primary focus:bg-white ${className}`}
    />
  );
}

function FSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-secondary border-[1.5px] border-transparent text-foreground px-3 py-2 rounded-lg text-sm outline-none transition-all focus:border-primary focus:bg-white appearance-none cursor-pointer"
    >
      {children}
    </select>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[0.72rem] font-medium px-3 py-1 rounded-full border-[1.5px] transition-all ${
        on
          ? "bg-[var(--klard-teal-l)] border-primary text-[var(--klard-teal-d)] font-semibold"
          : "bg-secondary border-transparent text-[var(--klard-mid)] hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

