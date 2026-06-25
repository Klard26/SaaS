import { Button } from "@/components/ui/button";
import { Briefcase, Wrench, ArrowRight } from "lucide-react";
import { rememberProviderWorld, type ProviderWorld } from "@/lib/providerWorld";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type AuthMode = "sign-in" | "sign-up";

const DOORS: Array<{
  world: ProviderWorld;
  icon: typeof Briefcase;
  title: string;
  subtitle: string;
  desc: string;
  amber: boolean;
}> = [
  {
    world: "pro",
    icon: Briefcase,
    title: "Berater",
    subtitle: "Beratung & Bauwesen",
    desc: "Energieberatung, Architektur, Statik & Tragwerksplanung, Sachverständige, Vermessung, TGA-Fachplanung und mehr.",
    amber: false,
  },
  {
    world: "alltag",
    icon: Wrench,
    title: "Alltag & Handwerk",
    subtitle: "Lokale Dienstleistungen",
    desc: "Handwerk, Haushalt & Reinigung, Garten & Landschaft, Beauty & Wellness, Pflege, Tierbetreuung, Events und mehr.",
    amber: true,
  },
];

/**
 * Two-door entry for the provider side: pick "Berater" (pro world) or
 * "Alltag & Handwerk" (alltag world) before the Clerk sign-in/sign-up form.
 * The chosen world is remembered (sessionStorage) and threaded via ?world= so
 * it survives the Clerk auth redirects. A full navigation is used so the
 * sign-in/sign-up page remounts and re-reads the world from the URL.
 */
export function AuthChooser({ mode }: { mode: AuthMode }) {
  function go(target: AuthMode, world: ProviderWorld) {
    rememberProviderWorld(world);
    window.location.assign(`${basePath}/${target}?world=${world}`);
  }

  const otherMode: AuthMode = mode === "sign-up" ? "sign-in" : "sign-up";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <a href={basePath || "/"} className="inline-flex items-baseline gap-1.5" data-testid="link-chooser-logo">
            <span className="klard-logo text-3xl">klar<span>d</span></span>
            <span className="text-base font-medium text-muted-foreground">Business</span>
          </a>
          <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-foreground">
            {mode === "sign-up" ? "Als Anbieter registrieren" : "Im Anbieterbereich anmelden"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wählen Sie Ihren Bereich.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {DOORS.map((d) => {
            const Icon = d.icon;
            return (
              <div
                key={d.world}
                className="rounded-2xl border border-border bg-white p-7 flex flex-col"
                data-testid={`card-world-${d.world}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    d.amber ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-lg text-foreground">{d.title}</h2>
                <p
                  className={`text-xs font-medium uppercase tracking-wide mt-0.5 ${
                    d.amber ? "text-amber-700" : "text-primary"
                  }`}
                >
                  {d.subtitle}
                </p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">{d.desc}</p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    onClick={() => go(mode, d.world)}
                    className={`rounded-full h-11 text-sm font-semibold gap-1.5 text-white ${
                      d.amber ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-[var(--klard-teal-d)]"
                    }`}
                    data-testid={`button-${mode}-${d.world}`}
                  >
                    {mode === "sign-up" ? "Registrieren" : "Einloggen"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => go(otherMode, d.world)}
                    className="rounded-full h-10 text-sm font-medium"
                    data-testid={`button-${otherMode}-${d.world}`}
                  >
                    {mode === "sign-up" ? "Stattdessen einloggen" : "Neu registrieren"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Sie sind Kunde?{" "}
          <a href="/" className="text-primary font-medium hover:underline" data-testid="link-customer-app">
            Zu Klard für Kunden
          </a>
        </p>
      </div>
    </div>
  );
}

export default AuthChooser;
