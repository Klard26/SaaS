import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Impressum() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 prose prose-sm prose-neutral flex-1">
        <h1 className="text-2xl font-bold text-foreground">Impressum</h1>
        <p className="text-muted-foreground">Angaben gemäß § 5 TMG</p>

        <h2 className="text-lg font-semibold mt-6">Anbieter</h2>
        <p>
          Klard GmbH (Beispiel)<br />
          Musterstraße 1<br />
          10115 Berlin<br />
          Deutschland
        </p>

        <h2 className="text-lg font-semibold mt-6">Kontakt</h2>
        <p>
          Telefon: +49 30 0000000<br />
          E-Mail: kontakt@klard.example
        </p>

        <h2 className="text-lg font-semibold mt-6">Vertretungsberechtigte</h2>
        <p>Geschäftsführung: Max Mustermann</p>

        <h2 className="text-lg font-semibold mt-6">Registereintrag</h2>
        <p>
          Eintragung im Handelsregister.<br />
          Registergericht: Amtsgericht Berlin-Charlottenburg<br />
          Registernummer: HRB 000000
        </p>

        <h2 className="text-lg font-semibold mt-6">Umsatzsteuer-ID</h2>
        <p>USt-IdNr. gemäß § 27 a UStG: DE000000000</p>

        <h2 className="text-lg font-semibold mt-6">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>Max Mustermann, Anschrift wie oben</p>

        <h2 className="text-lg font-semibold mt-6">Streitbeilegung</h2>
        <p>
          Plattform der EU-Kommission zur Online-Streitbeilegung:{" "}
          <a href="https://ec.europa.eu/consumers/odr" className="text-primary underline">https://ec.europa.eu/consumers/odr</a>.
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <p className="text-xs text-muted-foreground mt-8">
          Hinweis: Die hier angegebenen Daten sind Platzhalter. Bitte ergänzen Sie die korrekten Angaben Ihres Unternehmens vor Veröffentlichung.
        </p>
      </main>
      <Footer />
    </div>
  );
}
