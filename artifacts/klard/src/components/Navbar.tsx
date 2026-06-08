import { useClerk, useUser } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetAdminMe, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Navbar() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navQ, setNavQ] = useState("");
  const { data: adminMe } = useGetAdminMe({
    query: { queryKey: getGetAdminMeQueryKey(), enabled: !!isSignedIn },
  });
  const isAdmin = !!adminMe?.isAdmin;

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  function submitNavSearch(e: React.FormEvent) {
    e.preventDefault();
    const v = navQ.trim();
    setLocation(v ? `/search?q=${encodeURIComponent(v)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0" data-testid="link-logo">
          <span className="klard-logo text-2xl">klar<span>d</span></span>
        </Link>

        {/* Inline search (Doctolib-style) */}
        <form
          onSubmit={submitNavSearch}
          className="hidden md:flex flex-1 max-w-[460px] mx-4"
        >
          <div className="flex items-center w-full bg-secondary border-[1.5px] border-transparent focus-within:bg-white focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(8,145,178,0.1)] rounded-full h-10 px-4 transition-all">
            <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
            <input
              type="text"
              value={navQ}
              onChange={e => setNavQ(e.target.value)}
              placeholder="Branche, Anbieter oder Leistung suchen..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              data-testid="input-nav-search"
            />
          </div>
        </form>

        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium ml-auto">
          <Link href="/search" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-search">
            Berater finden
          </Link>
          <Link href="/gebaeudecheck" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-gebaeudecheck">
            Gebäudecheck
          </Link>
          <Link href="/energie" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-energie">
            WattWechsel
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-pricing">
            Für Berater
          </Link>
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/dashboard")} data-testid="menu-item-dashboard">Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/bookings")} data-testid="menu-item-bookings">Meine Buchungen</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/energie/portfolio")} data-testid="menu-item-energie">WattWechsel Cockpit</DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")} data-testid="menu-item-admin">
                    <Shield className="h-4 w-4 mr-2" /> Plattform-Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/immobilien/onboarding")} data-testid="menu-item-immobilien">Hausverwalter / Bestandshalter</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/provider/onboarding")} data-testid="menu-item-onboarding">Als Berater registrieren</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/provider/profile")} data-testid="menu-item-profile">Berater-Profil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/provider/services")} data-testid="menu-item-services">Meine Leistungen</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/provider/availability")} data-testid="menu-item-availability">Verfügbarkeit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut({ redirectUrl: basePath || "/" })}
                  data-testid="menu-item-signout"
                >
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/sign-in")}
                className="rounded-full border-[1.5px] border-border text-slate-700 hover:border-primary hover:text-primary px-4 h-9 text-xs font-semibold"
                data-testid="button-signin"
              >
                Einloggen
              </Button>
              <Button
                size="sm"
                onClick={() => setLocation("/sign-up")}
                className="rounded-full bg-primary hover:bg-[var(--klard-teal-d)] text-white px-4 h-9 text-xs font-semibold"
                data-testid="button-signup"
              >
                Kostenlos registrieren
              </Button>
            </div>
          )}

          <button
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <Link href="/search" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Berater finden</Link>
            <Link href="/gebaeudecheck" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Gebäudecheck</Link>
            <Link href="/energie" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>WattWechsel</Link>
            <Link href="/pricing" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Für Berater</Link>
            {isSignedIn && (
              <>
                <Link href="/bookings" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Meine Buchungen</Link>
                <Link href="/dashboard" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link href="/energie/portfolio" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>WattWechsel Cockpit</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
