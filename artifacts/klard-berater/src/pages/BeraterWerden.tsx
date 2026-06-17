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
  Check,
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
    { icon: Users, title: "Neue Kunden", desc: "Werden Sie von Kunden gefunden, die aktiv nach Beratung in Ihrem Fachbereich suchen." },
    { icon: CalendarCheck, title: "Online-Terminbuchung", desc: "Kunden buchen verfügbare Termine in Echtzeit – ganz ohne Telefon und E-Mail-Pingpong." },
    { icon: Sparkles, title: "KI-Angebote", desc: "Erstellen Sie in Sekunden rechtsverbindliche, gebrandete Angebote mit automatischer Bedarfsanalyse." },
    { icon: TrendingUp, title: "Mehr Sichtbarkeit", desc: "Mit Premium erscheinen Sie priorisiert in der Suche und auf der Startseite." },
    { icon: ShieldCheck, title: "Verifiziertes Profil", desc: "Zeigen Sie Qualifikationen, Kammer-Mitgliedschaften und Bewertungen vertrauensvoll." },
    { icon: Clock, title: "Kalender-Sync", desc: "Synchronisieren Sie Buchungen per iCal mit Ihrem bestehenden Kalender." },
  ];

  const schritte = [
    { icon: UserPlus, title: "Konto erstellen", desc: "Registrieren Sie sich kostenlos mit Name und E-Mail." },
    { icon: ListChecks, title: "Profil & Leistungen anlegen", desc: "Fachbereich, Über-mich, Preise und Leistungen hinterlegen." },
    { icon: CalendarClock, title: "Termine freigeben", desc: "Verfügbarkeiten eintragen – und Kunden buchen direkt." },
  ];

  const faqs = [
    {
      q: "Was kostet die Nutzung von Klard?",
      a: "Der Basis-Tarif ist kostenlos – es fällt lediglich eine Vermittlungsgebühr von 9 % pro vermittelter Buchung an. Premium kostet 89 € pro Monat und reduziert die Gebühr auf 4 %.",
    },
    {
      q: "Für welche Fachbereiche ist Klard geeignet?",
      a: "Für Bau- und Gebäudeberater: Energieberatung, Architektur, Statik/Tragwerksplanung, Bauberatung, Gebäudesachverständige, Vermessung, TGA-Fachplanung und Bauphysik.",
    },
    {
      q: "Wie schnell bin ich startklar?",
      a: "In wenigen Minuten: Konto erstellen, Profil und Leistungen anlegen, Verfügbarkeiten eintragen – danach können Kunden direkt Termine buchen.",
    },
    {
      q: "Kann ich meinen bestehenden Kalender anbinden?",
      a: "Ja. Mit Premium synchronisieren Sie Ihre Buchungen per iCal-Feed mit Ihrem bestehenden Kalender (z. B. Google, Outlook, Apple).",
    },
    {
      q: "Bin ich an einen Vertrag gebunden?",
      a: "Nein. Der Basis-Tarif ist dauerhaft kostenlos und Premium ist monatlich kündbar.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[var(--klard-teal-p)] to-background border-b border-border">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-3 py-1 mb-5">
            Für Berater & Planungsbüros
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-tight">
            Gewinnen Sie neue Aufträge – planbar und digital
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto">
            Klard ist der separate Profi-Bereich für Energieberater, Architekten, Statiker,
            Gebäudesachverständige und weitere Bau- und Gebäudeexperten. Profil erstellen,
            Termine freigeben, Aufträge empfangen.
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

      {/* Preise */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Transparente Preise</h2>
          <p className="text-muted-foreground mt-2">Kostenlos starten, jederzeit auf Premium upgraden.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-white p-7 flex flex-col">
            <h3 className="font-semibold text-foreground">Basis</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">0 €</span>
              <span className="text-sm text-muted-foreground">/ Monat</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">9 % Vermittlungsgebühr pro Buchung</p>
            <ul className="mt-5 space-y-2.5 text-sm text-foreground flex-1">
              {["Öffentliches Berater-Profil", "Online-Terminbuchung", "Bewertungen sammeln", "Per-Buchung Kalender-Export"].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              onClick={startRegistration}
              className="mt-6 rounded-full h-11 text-sm font-semibold"
              data-testid="button-berater-basis"
            >
              Kostenlos starten
            </Button>
          </div>

          <div className="rounded-2xl border-2 border-primary bg-white p-7 flex flex-col relative">
            <span className="absolute -top-3 left-7 text-xs font-semibold uppercase tracking-wide text-white bg-primary rounded-full px-3 py-1">
              Empfohlen
            </span>
            <h3 className="font-semibold text-foreground">Premium</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">89 €</span>
              <span className="text-sm text-muted-foreground">/ Monat</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">nur 4 % Vermittlungsgebühr pro Buchung</p>
            <ul className="mt-5 space-y-2.5 text-sm text-foreground flex-1">
              {["Alles aus Basis", "Priorisiert in Suche & Startseite", "KI-Angebote & Bedarfsanalyse", "Kalender-Sync (iCal-Abo)"].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={startRegistration}
              className="mt-6 rounded-full h-11 text-sm font-semibold bg-primary hover:bg-[var(--klard-teal-d)] text-white"
              data-testid="button-berater-premium"
            >
              Mit Premium starten
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-5">
          Premium ist monatlich kündbar. Details auf der{" "}
          <button
            type="button"
            onClick={() => setLocation("/pricing")}
            className="text-primary font-medium hover:underline"
            data-testid="link-berater-pricing-details"
          >
            Preisübersicht
          </button>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-[760px] mx-auto px-4 sm:px-8 py-16 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Häufige Fragen</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-white px-5 py-4"
                data-testid="faq-item"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-foreground list-none">
                  {f.q}
                  <span className="text-primary text-xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
        <div className="rounded-2xl bg-primary text-primary-foreground px-6 sm:px-12 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Bereit, neue Aufträge zu gewinnen?</h2>
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
