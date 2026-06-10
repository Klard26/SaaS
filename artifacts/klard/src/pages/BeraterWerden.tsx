import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Users,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  UserPlus,
  ListChecks,
  CalendarClock,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function BeraterWerden() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();

  function startRegistration() {
    if (isSignedIn) {
      setLocation("/provider/onboarding");
    } else {
      window.location.assign(`${basePath}/sign-up?intent=berater`);
    }
  }

  const vorteile = [
    { icon: Users, title: "Neue Mandanten", desc: "Werden Sie von Kunden gefunden, die aktiv nach Beratung in Ihrem Fachbereich suchen." },
    { icon: CalendarCheck, title: "Online-Terminbuchung", desc: "Mandanten buchen verfügbare Termine in Echtzeit – ganz ohne Telefon und E-Mail-Pingpong." },
    { icon: Sparkles, title: "KI-Angebote", desc: "Erstellen Sie in Sekunden rechtsverbindliche, gebrandete Angebote mit automatischer Bedarfsanalyse." },
    { icon: TrendingUp, title: "Mehr Sichtbarkeit", desc: "Mit Premium erscheinen Sie priorisiert in der Suche und auf der Startseite." },
    { icon: ShieldCheck, title: "Verifiziertes Profil", desc: "Zeigen Sie Qualifikationen, Kammer-Mitgliedschaften und Bewertungen vertrauensvoll." },
    { icon: Clock, title: "Kalender-Sync", desc: "Synchronisieren Sie Buchungen per iCal mit Ihrem bestehenden Kalender." },
  ];

  const schritte = [
    { icon: UserPlus, title: "Konto erstellen", desc: "Registrieren Sie sich kostenlos mit Name und E-Mail." },
    { icon: ListChecks, title: "Profil & Leistungen anlegen", desc: "Fachbereich, Über-mich, Preise und Leistungen hinterlegen." },
    { icon: CalendarClock, title: "Termine freigeben", desc: "Verfügbarkeiten eintragen – und Mandanten buchen direkt." },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[var(--klard-teal-p)] to-background border-b border-border">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-3 py-1 mb-5">
            Für Berater & Kanzleien
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-tight">
            Gewinnen Sie neue Mandanten – planbar und digital
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto">
            Klard ist der separate Profi-Bereich für Steuerberater, Rechtsanwälte, Energieberater
            und weitere Fachleute. Profil erstellen, Termine freigeben, Mandanten empfangen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button
              size="lg"
              onClick={startRegistration}
              className="rounded-full bg-primary hover:bg-[var(--klard-teal-d)] text-white px-8 h-12 text-sm font-semibold"
              data-testid="button-start-berater"
            >
              Jetzt als Berater registrieren
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/pricing")}
              className="rounded-full border-[1.5px] px-8 h-12 text-sm font-semibold"
              data-testid="button-berater-pricing"
            >
              Preise ansehen
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Kostenlos starten · keine Grundgebühr im Basis-Tarif · nur Vermittlungsgebühr pro Buchung
          </p>
        </div>
      </section>

      {/* Vorteile */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Ihre Vorteile als Berater</h2>
          <p className="text-muted-foreground mt-2">Alles, was Sie brauchen, um digital zu wachsen.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vorteile.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-xl border border-border bg-white p-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-foreground">{v.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ablauf */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">In drei Schritten startklar</h2>
            <p className="text-muted-foreground mt-2">In wenigen Minuten eingerichtet.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {schritte.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-border mb-4">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
        <div className="rounded-2xl bg-primary text-primary-foreground px-6 sm:px-12 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Bereit, neue Mandanten zu gewinnen?</h2>
          <p className="text-primary-foreground/80 mt-3 max-w-xl mx-auto">
            Erstellen Sie Ihr Berater-Profil – kostenlos und in wenigen Minuten.
          </p>
          <Button
            size="lg"
            onClick={startRegistration}
            className="mt-7 rounded-full bg-white text-primary hover:bg-white/90 px-8 h-12 text-sm font-semibold"
            data-testid="button-start-berater-bottom"
          >
            Jetzt als Berater registrieren
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
