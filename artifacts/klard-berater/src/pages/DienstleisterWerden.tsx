import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Users,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Clock,
  UserPlus,
  ListChecks,
  CalendarClock,
} from "lucide-react";
import { rememberProviderWorld } from "@/lib/providerWorld";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function DienstleisterWerden() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useUser();

  function startRegistration() {
    rememberProviderWorld("alltag");
    if (isSignedIn) {
      setLocation("/provider/onboarding?world=alltag");
    } else {
      window.location.assign(`${basePath}/sign-up?intent=dienstleister&world=alltag`);
    }
  }

  function startLogin() {
    rememberProviderWorld("alltag");
    window.location.assign(`${basePath}/sign-in?world=alltag`);
  }

  const vorteile = [
    { icon: Users, title: "Regionale Kundschaft", desc: "Werden Sie von Kunden in Ihrer Nähe gefunden, die genau Ihre Leistung suchen." },
    { icon: CalendarCheck, title: "Online-Terminbuchung", desc: "Kunden buchen freie Termine in Echtzeit – ohne Telefon- und E-Mail-Pingpong." },
    { icon: MessageSquare, title: "Anfragen & Aufträge", desc: "Erhalten Sie konkrete Anfragen und Buchungen direkt über Ihr Profil." },
    { icon: ShieldCheck, title: "Verifiziertes Profil", desc: "Zeigen Sie Qualifikationen, Meisterbrief und Bewertungen vertrauensvoll." },
    { icon: TrendingUp, title: "Mehr Sichtbarkeit", desc: "Mit Premium erscheinen Sie priorisiert in der Suche und auf der Startseite." },
    { icon: Clock, title: "Kalender-Sync", desc: "Synchronisieren Sie Buchungen per iCal mit Ihrem bestehenden Kalender." },
  ];

  const schritte = [
    { icon: UserPlus, title: "Konto erstellen", desc: "Registrieren Sie sich kostenlos mit Name und E-Mail." },
    { icon: ListChecks, title: "Profil & Leistungen anlegen", desc: "Fachbereich, Über-mich, Preise und Leistungen hinterlegen." },
    { icon: CalendarClock, title: "Termine freigeben", desc: "Verfügbarkeiten eintragen – und Kunden buchen direkt." },
  ];

  const faqs = [
    {
      q: "Für welche Bereiche ist dieser Bereich gedacht?",
      a: "Für Alltags- und Handwerksleistungen: Handwerk, Haushalt & Reinigung, Garten & Landschaft, Mode & Textil, Beauty & Wellness, Tier, Familie & Betreuung, Events sowie Senioren- und Alltagshilfe.",
    },
    {
      q: "Was kostet die Nutzung von Klard?",
      a: "Der Basis-Tarif ist kostenlos. Details zu Gebühren und zum Premium-Tarif finden Sie auf der Preisübersicht.",
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
      q: "Ich biete Beratung oder Bauplanung an – bin ich hier richtig?",
      a: "Dann nutzen Sie den separaten Bereich für Beratung & Bauwesen. Den Link finden Sie oben am Seitenanfang.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[var(--klard-teal-p)] to-background border-b border-border">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-3 py-1 mb-5">
            Für Handwerk & Alltags-Dienstleister
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-tight">
            Mehr Aufträge aus Ihrer Region – einfach digital
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto">
            Klard ist der separate Bereich für Handwerk, Reinigung, Garten- und Landschaftsbau,
            Beauty, Pflege, Tierbetreuung, Eventdienstleister und weitere Alltags-Dienstleister.
            Profil erstellen, Verfügbarkeit zeigen, Anfragen und Buchungen erhalten.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button
              size="lg"
              onClick={startRegistration}
              className="rounded-full bg-primary hover:bg-[var(--klard-teal-d)] text-white px-8 h-12 text-sm font-semibold"
              data-testid="button-start-dienstleister"
            >
              Jetzt als Dienstleister registrieren
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={startLogin}
              className="rounded-full border-[1.5px] px-8 h-12 text-sm font-semibold"
              data-testid="button-dienstleister-login"
            >
              Einloggen
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Kostenlos starten · keine Grundgebühr im Basis-Tarif
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Sie bieten Beratung oder Bauplanung an?{" "}
            <a
              href={`${basePath}/`}
              className="text-primary font-medium hover:underline"
              data-testid="link-to-berater-area"
            >
              Zum Bereich für Beratung &amp; Bauwesen
            </a>
          </p>
        </div>
      </section>

      {/* Vorteile */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Ihre Vorteile als Dienstleister</h2>
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
        <div className="rounded-2xl border border-border bg-white px-6 sm:px-12 py-12 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Transparente Preise</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Kostenlos starten, jederzeit auf Premium upgraden. Alle Details zu Gebühren
            und Leistungen finden Sie in der Preisübersicht.
          </p>
          <Button
            variant="outline"
            onClick={() => setLocation("/pricing")}
            className="mt-6 rounded-full h-11 px-8 text-sm font-semibold"
            data-testid="button-dienstleister-pricing"
          >
            Preise ansehen
          </Button>
        </div>
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
          <h2 className="text-2xl sm:text-3xl font-bold">Bereit für neue Aufträge?</h2>
          <p className="text-primary-foreground/80 mt-3 max-w-xl mx-auto">
            Erstellen Sie Ihr Dienstleister-Profil – kostenlos und in wenigen Minuten.
          </p>
          <Button
            size="lg"
            onClick={startRegistration}
            className="mt-7 rounded-full bg-white text-primary hover:bg-white/90 px-8 h-12 text-sm font-semibold"
            data-testid="button-start-dienstleister-bottom"
          >
            Jetzt als Dienstleister registrieren
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
