import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { useListProviders, useListCategories, getListProvidersQueryKey } from "@workspace/api-client-react";
import { Star, MapPin, CheckCircle, Search, SlidersHorizontal, X, Crown, Briefcase } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Footer } from "@/components/Footer";
import { publicUrlForObjectPath } from "@/lib/upload";
import { formatPriceEUR } from "@/lib/dateFmt";

export default function SearchPage() {
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [zip, setZip] = useState(params.get("zip") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const queryParams = {
    ...(q ? { q } : {}),
    ...(city ? { city } : {}),
    ...(zip ? { zip } : {}),
    ...(category && category !== "all" ? { category } : {}),
    ...(minPrice ? { minPrice: Number(minPrice) } : {}),
    ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
    limit: 50,
  };

  const { data: providers = [], isLoading } = useListProviders(queryParams);
  const { data: categories = [] } = useListCategories();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    qc.invalidateQueries({ queryKey: getListProvidersQueryKey(queryParams) });
  }

  function clearFilters() {
    setQ("");
    setCity("");
    setZip("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
  }

  const hasFilters = q || city || zip || (category && category !== "all") || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="border-b border-border bg-muted/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <form onSubmit={handleSearch} className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name, Fachbereich suchen..."
                className="pl-9 h-11"
                value={q}
                onChange={e => setQ(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Input
              placeholder="Stadt oder PLZ"
              className="h-11 sm:w-44"
              value={city}
              onChange={e => setCity(e.target.value)}
              data-testid="input-city"
            />
            <Button type="submit" className="h-11" data-testid="button-search-submit">
              Suchen
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2"
              onClick={() => setFiltersOpen(!filtersOpen)}
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
              {hasFilters && <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">!</Badge>}
            </Button>
          </form>

          {filtersOpen && (
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fachbereich</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 w-52" data-testid="select-category">
                    <SelectValue placeholder="Alle Kategorien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Preis ab (€)</label>
                <Input
                  placeholder="Min."
                  className="h-9 w-24"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  type="number"
                  min={0}
                  data-testid="input-min-price"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Preis bis (€)</label>
                <Input
                  placeholder="Max."
                  className="h-9 w-24"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  type="number"
                  min={0}
                  data-testid="input-max-price"
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 text-muted-foreground" data-testid="button-clear-filters">
                  <X className="h-3.5 w-3.5" /> Filter zuruck
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground" data-testid="text-results-count">
            {isLoading ? "Lade..." : `${providers.length} Berater gefunden`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Keine Berater gefunden</p>
            <p className="text-sm mt-1">Versuchen Sie andere Suchbegriffe oder passen Sie die Filter an.</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters} data-testid="button-clear-search">
              Suche zurucksetzen
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(provider => (
              <Card
                key={provider.id}
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setLocation(`/providers/${provider.id}`)}
                data-testid={`card-provider-${provider.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary overflow-hidden border border-border">
                      {provider.logoUrl ? (
                        <img
                          src={publicUrlForObjectPath(provider.logoUrl)}
                          alt={`Logo ${provider.displayName}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        provider.displayName.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm truncate">{provider.displayName}</h3>
                        {provider.verified && <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" aria-label="Verifiziert" />}
                        {provider.subscriptionTier === "premium" && (
                          <Badge variant="secondary" className="h-4 px-1.5 gap-0.5 bg-amber-100 text-amber-900 border-amber-200 text-[10px]">
                            <Crown className="h-2.5 w-2.5" /> Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{provider.category}</p>
                      {provider.yearsExperience != null && provider.yearsExperience > 0 && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-3 w-3" /> {provider.yearsExperience} J. Erfahrung
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      <span className="text-sm font-medium" aria-label={`Bewertung ${provider.rating.toFixed(1)} von 5`}>{provider.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {provider.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{provider.bio}</p>
                  )}

                  <Separator className="mb-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{provider.city}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      ab {provider.minPrice === 0 ? "kostenlos" : formatPriceEUR(provider.minPrice)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
