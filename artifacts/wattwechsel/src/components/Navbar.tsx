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
import { ChevronDown, Menu, X, Zap } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0 flex items-center gap-2" data-testid="link-logo">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--klard-green)]">
            <Zap className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="klard-logo text-xl">ener<span>watt24</span></span>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium ml-auto">
          <Link href="/" className="text-muted-foreground hover:text-[var(--klard-green)] transition-colors" data-testid="link-start">
            Start
          </Link>
          {isSignedIn && (
            <Link href="/portfolio" className="text-muted-foreground hover:text-[var(--klard-green)] transition-colors" data-testid="link-cockpit">
              Cockpit
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="text-xs bg-[var(--klard-green)] text-white">{initials}</AvatarFallback>
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
                <DropdownMenuItem onClick={() => setLocation("/portfolio")} data-testid="menu-item-cockpit">Cockpit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/onboarding")} data-testid="menu-item-onboarding">Registrierung bearbeiten</DropdownMenuItem>
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
                className="rounded-full border-[1.5px] border-border text-slate-700 hover:border-[var(--klard-green)] hover:text-[var(--klard-green)] px-4 h-9 text-xs font-semibold"
                data-testid="button-signin"
              >
                Einloggen
              </Button>
              <Button
                size="sm"
                onClick={() => setLocation("/sign-up")}
                className="rounded-full bg-[var(--klard-green)] hover:bg-[var(--klard-green)]/90 text-white px-4 h-9 text-xs font-semibold"
                data-testid="button-signup"
              >
                Kostenlos starten
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
            <Link href="/" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Start</Link>
            {isSignedIn && (
              <Link href="/portfolio" className="py-2 text-sm text-foreground" onClick={() => setMobileOpen(false)}>Cockpit</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
