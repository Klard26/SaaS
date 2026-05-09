import { useClerk, useUser } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0" data-testid="link-logo">
          <span className="text-xl font-bold tracking-tight text-primary">Klard</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-search">
            Berater finden
          </Link>
          {isSignedIn && (
            <>
              <Link href="/bookings" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-bookings">
                Meine Buchungen
              </Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-dashboard">
                Dashboard
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
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
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/dashboard")} data-testid="menu-item-dashboard">
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/bookings")} data-testid="menu-item-bookings">
                  Meine Buchungen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/provider/onboarding")} data-testid="menu-item-onboarding">
                  Als Berater registrieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/provider/profile")} data-testid="menu-item-profile">
                  Berater-Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/provider/services")} data-testid="menu-item-services">
                  Meine Leistungen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/provider/availability")} data-testid="menu-item-availability">
                  Verfügbarkeit
                </DropdownMenuItem>
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
              <Button variant="ghost" size="sm" onClick={() => setLocation("/sign-in")} data-testid="button-signin">
                Anmelden
              </Button>
              <Button size="sm" onClick={() => setLocation("/sign-up")} data-testid="button-signup">
                Registrieren
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
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <Link href="/search" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>
              Berater finden
            </Link>
            {isSignedIn && (
              <>
                <Link href="/bookings" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>
                  Meine Buchungen
                </Link>
                <Link href="/dashboard" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
