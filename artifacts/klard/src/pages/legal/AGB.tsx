import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function AGB() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 prose prose-sm prose-neutral flex-1">
        <h1 className="text-2xl font-bold text-foreground">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p className="text-muted-foreground">Stand: {new Date().toLocaleDateString("de-DE")}</p>

        <h2 className="text-lg font-semibold mt-6">1. Geltungsbereich</h2>
        <p>
          Diese AGB regeln die Nutzung der Plattform Klard, einer Vermittlungsplattform für die Buchung
          von Beratungsleistungen zwischen Mandantinnen/Mandanten („Nutzer") und Beraterinnen/Beratern
          („Berater") in Deutschland.
        </p>

        <h2 className="text-lg font-semibold mt-6">2. Leistungen von Klard</h2>
        <p>
          Klard stellt eine Online-Plattform zur Verfügung, auf der Nutzer Berater suchen, vergleichen
          und Termine buchen können. Klard wird ausschließlich als Vermittler tätig und ist nicht
          Vertragspartner der zwischen Nutzer und Berater geschlossenen Beratungsverträge.
        </p>

        <h2 className="text-lg font-semibold mt-6">3. Registrierung und Profile</h2>
        <p>
          Für eine Buchung ist ein Nutzerkonto erforderlich. Berater verpflichten sich, wahrheitsgemäße
          Angaben zu Qualifikation, Standort und Leistungen zu machen.
        </p>

        <h2 className="text-lg font-semibold mt-6">4. Buchungen und Vergütung</h2>
        <p>
          Die Buchung kommt zwischen Nutzer und Berater zustande. Klard berechnet eine Vermittlungsprovision
          (9 % Basic, 4 % Premium). Reglementierte Honorare (RVG, StBVV) werden vom Berater direkt mit dem
          Nutzer abgerechnet; eine Zahlungsabwicklung über Klard findet in diesen Fällen nicht statt.
        </p>

        <h2 className="text-lg font-semibold mt-6">5. Premium-Mitgliedschaft</h2>
        <p>
          Berater können eine Premium-Mitgliedschaft (89 €/Monat) abschließen. Sie verlängert sich monatlich
          und ist jeweils zum Ende des Abrechnungszeitraums kündbar.
        </p>

        <h2 className="text-lg font-semibold mt-6">6. Stornierung und Widerruf</h2>
        <p>
          Stornierungsbedingungen werden vom jeweiligen Berater festgelegt. Verbraucher haben unter den
          Voraussetzungen der §§ 312g, 355 BGB ein Widerrufsrecht. Bei Beratungsdienstleistungen, die zu einem
          vereinbarten Termin durchgeführt werden, kann das Widerrufsrecht erlöschen, sobald die Leistung
          mit ausdrücklicher Zustimmung beginnt.
        </p>

        <h2 className="text-lg font-semibold mt-6">7. Haftung</h2>
        <p>
          Klard haftet nicht für die Qualität, Rechtmäßigkeit oder Verfügbarkeit der durch Berater
          angebotenen Leistungen. Eine Haftung für Vorsatz und grobe Fahrlässigkeit bleibt unberührt.
        </p>

        <h2 className="text-lg font-semibold mt-6">8. Bewertungen</h2>
        <p>
          Bewertungen sind nur nach einer tatsächlich stattgefundenen Buchung möglich. Klard behält sich vor,
          unzulässige Bewertungen zu entfernen.
        </p>

        <h2 className="text-lg font-semibold mt-6">9. Schlussbestimmungen</h2>
        <p>
          Es gilt deutsches Recht. Sofern der Nutzer Kaufmann, juristische Person des öffentlichen Rechts
          oder öffentlich-rechtliches Sondervermögen ist, ist Gerichtsstand Berlin.
        </p>

        <p className="text-xs text-muted-foreground mt-8">
          Diese AGB sind eine vereinfachte Vorlage und ersetzen keine individuelle Rechtsberatung.
        </p>
      </main>
      <Footer />
    </div>
  );
}
