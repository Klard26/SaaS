import { useClerk, useUser } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetMyProviderProfile, getGetMyProviderProfileQueryKey } from "@workspace/api-client-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Navbar() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: providerProfile } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey(), enabled: !!isSignedIn, retry: false },
  });
  const hasProvider = !!providerProfile?.id;

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0 flex items-baseline gap-1.5" data-testid="link-logo">
          <span className="klard-logo text-2xl">klar<span>d</span></span>
          <span className="text-sm font-medium text-muted-foreground">für Berater</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium ml-auto">
          {hasProvider ? (
            <>
              <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-dashboard">
                Dashboard
              </Link>
              <Link href="/anfragen" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-anfragen">
                Anfragen
              </Link>
              <Link href="/provider/services" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-services">
                Meine Leistungen
              </Link>
              <Link href="/provider/availability" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-availability">
                Verfügbarkeit
              </Link>
              <Link href="/wallet" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-wallet">
                Guthaben
              </Link>
            </>
          ) : (
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-home">
              Vorteile
            </Link>
          )}
          <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-pricing">
            Preise
          </Link>
          <Link href="/dienstleister-werden" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-alltag-area">
            Alltag &amp; Handwerk
          </Link>
          <a href="/" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-customer-app">
            Für Kunden
          </a>
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
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Beraterbereich</DropdownMenuLabel>
                {hasProvider ? (
                  <>
                    <DropdownMenuItem onClick={() => setLocation("/dashboard")} data-testid="menu-item-dashboard">Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/anfragen")} data-testid="menu-item-anfragen">Anfragen</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/provider/profile")} data-testid="menu-item-profile">Berater-Profil</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/provider/services")} data-testid="menu-item-services">Meine Leistungen</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/provider/availability")} data-testid="menu-item-availability">Verfügbarkeit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/wallet")} data-testid="menu-item-wallet">Lead-Guthaben</DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => setLocation("/provider/onboarding")} data-testid="menu-item-onboarding">Profil erstellen</DropdownMenuItem>
                )}
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
                Als Berater starten
              </Button>
            </div>
          )}

          <button
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-white">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {hasProvider ? (
              <>
                <Link href="/dashboard" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link href="/anfragen" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Anfragen</Link>
                <Link href="/provider/profile" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Berater-Profil</Link>
                <Link href="/provider/services" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Meine Leistungen</Link>
                <Link href="/provider/availability" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Verfügbarkeit</Link>
                <Link href="/wallet" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Lead-Guthaben</Link>
              </>
            ) : (
              <Link href="/" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Vorteile</Link>
            )}
            <Link href="/pricing" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Preise</Link>
            <Link href="/dienstleister-werden" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Alltag &amp; Handwerk</Link>
            <a href="/" className="py-2 text-sm text-foreground">Für Kunden</a>
          </nav>
        </div>
      )}
    </header>
  );
}
