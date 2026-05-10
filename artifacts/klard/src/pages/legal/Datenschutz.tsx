import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 prose prose-sm prose-neutral flex-1">
        <h1 className="text-2xl font-bold text-foreground">Datenschutzerklärung</h1>
        <p className="text-muted-foreground">Stand: {new Date().toLocaleDateString("de-DE")}</p>

        <h2 className="text-lg font-semibold mt-6">1. Verantwortlicher</h2>
        <p>
          Klard GmbH (Beispiel), Musterstraße 1, 10115 Berlin, kontakt@klard.example.
        </p>

        <h2 className="text-lg font-semibold mt-6">2. Verarbeitete Daten</h2>
        <ul>
          <li>Konto-Daten: Name, E-Mail, Profilbild (Clerk Authentifizierung)</li>
          <li>Berater-Profil: Anzeigename, Bio, Adresse, Telefon, Logo</li>
          <li>Buchungsdaten: Termin, Leistung, Preis, Notizen</li>
          <li>Zahlungsdaten: Verarbeitung über Stripe; Klard speichert keine Kartendaten</li>
          <li>Server-Logs: IP, User-Agent, Zeitstempel (zu Sicherheitszwecken, max. 30 Tage)</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">3. Rechtsgrundlagen</h2>
        <p>
          Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) für Buchungen, berechtigtes Interesse
          (lit. f) für Sicherheits- und Betrugsabwehr-Logs, Einwilligung (lit. a) für optionale
          Funktionen.
        </p>

        <h2 className="text-lg font-semibold mt-6">4. Auftragsverarbeiter</h2>
        <ul>
          <li>Clerk Inc. – Authentifizierung</li>
          <li>Stripe Payments Europe Ltd. – Zahlungsabwicklung</li>
          <li>Anthropic – KI-Angebotsgenerierung (optional, nur bei Berater-Nutzung)</li>
          <li>Hosting: Replit / Google Cloud (Frankfurt, EU)</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">5. Speicherdauer</h2>
        <p>
          Buchungen und steuerlich relevante Daten 10 Jahre (§ 147 AO). Konten werden auf Verlangen
          gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>

        <h2 className="text-lg font-semibold mt-6">6. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung und Datenübertragbarkeit
          (Art. 15–20 DSGVO) sowie das Recht, sich bei der Aufsichtsbehörde zu beschweren
          (Berliner Beauftragte für Datenschutz und Informationsfreiheit).
        </p>

        <h2 className="text-lg font-semibold mt-6">7. Kontakt Datenschutz</h2>
        <p>datenschutz@klard.example</p>

        <p className="text-xs text-muted-foreground mt-8">
          Diese Erklärung ist eine vereinfachte Vorlage und ersetzt keine individuelle Rechtsberatung.
        </p>
      </main>
      <Footer />
    </div>
  );
}
