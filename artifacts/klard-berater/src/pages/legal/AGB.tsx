import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const AGB_VERSION = "2026-06";

export default function AGB() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <h1 className="text-3xl font-serif font-bold text-foreground">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Klard – Plattform zur Vermittlung von Beratungsleistungen
        </p>
        <p className="text-sm text-muted-foreground">
          Version {AGB_VERSION} · Stand: {new Date().toLocaleDateString("de-DE")}
        </p>

        {/* Inhaltsübersicht */}
        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">Inhaltsübersicht</p>
          <ol className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground list-decimal list-inside">
            <li>Geltungsbereich und Begriffe</li>
            <li>Rolle und Leistungen von Klard</li>
            <li>Registrierung und Nutzerkonto</li>
            <li>Vertragsschluss / Annahme von Angeboten</li>
            <li>Preise, Zahlung und Provision</li>
            <li>KI-Angebote und Festpreise</li>
            <li>Stornierung und Widerrufsrecht</li>
            <li>Pflichten der Berater</li>
            <li>Premium-Mitgliedschaft</li>
            <li>Bewertungen und Inhalte</li>
            <li>Haftung</li>
            <li>Datenschutz</li>
            <li>Laufzeit und Kündigung</li>
            <li>Streitbeilegung</li>
            <li>Schlussbestimmungen</li>
          </ol>
        </div>

        <Section n="§ 1" title="Geltungsbereich und Begriffe">
          <p>
            (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") regeln die Nutzung der
            von der Klard (nachfolgend „Klard", „wir" oder „Plattform") betriebenen Online-Plattform,
            über die Beratungsleistungen vermittelt und gebucht werden.
          </p>
          <p>
            (2) „Nutzer" bzw. „Kunde" ist jede natürliche oder juristische Person, die über die
            Plattform Beratungsleistungen sucht, anfragt oder bucht. „Berater" ist jede Person oder
            jedes Unternehmen, die bzw. das über die Plattform Beratungsleistungen anbietet.
            „Verbraucher" ist ein Nutzer im Sinne des § 13 BGB.
          </p>
          <p>
            (3) Es gelten ausschließlich diese AGB. Abweichende Bedingungen des Nutzers oder
            Beraters werden nur wirksam, wenn Klard ihnen ausdrücklich schriftlich zustimmt.
          </p>
          <p>
            (4) Diese AGB gliedern sich in einen Allgemeinen Teil (§§ 1–7, 10–15), einen Teil für
            Kunden (§ 4–7) sowie besondere Bestimmungen für Berater (§ 8, § 9).
          </p>
        </Section>

        <Section n="§ 2" title="Rolle und Leistungen von Klard">
          <p>
            (1) Klard stellt eine technische Plattform bereit, auf der Nutzer Berater suchen,
            vergleichen, Angebote einholen und Termine buchen können. Hierzu gehören u. a. Such- und
            Filterfunktionen, ein Gebäudecheck-/Analyse-Tool, eine KI-gestützte Angebotserstellung,
            Terminbuchung, Zahlungsabwicklung und Kalenderfunktionen.
          </p>
          <p>
            (2) Klard wird ausschließlich als Vermittler tätig. Die Beratungsverträge kommen
            unmittelbar zwischen Nutzer und Berater zustande. Klard ist nicht Vertragspartner des
            Beratungsvertrags und schuldet keine Beratungsleistung.
          </p>
          <p>
            (3) Klard übernimmt keine Gewähr dafür, dass über die Plattform ein Vertrag zustande
            kommt oder dass Berater verfügbar sind.
          </p>
        </Section>

        <Section n="§ 3" title="Registrierung und Nutzerkonto">
          <p>
            (1) Für Buchungen und die Annahme von Angeboten ist ein Nutzerkonto erforderlich. Die
            Registrierung erfolgt über den von Klard eingesetzten Authentifizierungsdienst.
          </p>
          <p>
            (2) Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und seine
            Zugangsdaten vertraulich zu behandeln. Eine Weitergabe an Dritte ist unzulässig.
          </p>
          <p>
            (3) Der Nutzer muss volljährig und unbeschränkt geschäftsfähig sein.
          </p>
        </Section>

        <Section n="§ 4" title="Vertragsschluss / Annahme von Angeboten (Kunden)">
          <p>
            (1) Die Darstellung von Beratern und Leistungen auf der Plattform stellt kein
            rechtsverbindliches Angebot, sondern eine Aufforderung zur Abgabe einer Anfrage dar
            (invitatio ad offerendum).
          </p>
          <p>
            (2) Wählt der Nutzer im Bereich „Ihr Angebot" eine oder mehrere Leistungen aus, wird ihm
            ein verbindliches Angebot mit Festpreisen angezeigt. Durch Aktivieren der entsprechenden
            Bestätigung („Ich nehme das Angebot verbindlich an") und Betätigen der Schaltfläche
            „Angebot verbindlich annehmen" gibt der Nutzer eine verbindliche Vertragserklärung ab.
          </p>
          <p>
            (3) Mit der Annahme kommt ein kostenpflichtiger Vertrag über die ausgewählten Leistungen
            zwischen Nutzer und Berater zustande. Der Nutzer erhält eine Bestätigung; eine Übersicht
            der angenommenen Angebote ist im Konto unter „Meine Angebote" abrufbar.
          </p>
          <p>
            (4) Die zum Zeitpunkt der Annahme angezeigte Fassung dieser AGB (Version {AGB_VERSION})
            wird Vertragsbestandteil und für Nachweiszwecke gespeichert.
          </p>
        </Section>

        <Section n="§ 5" title="Preise, Zahlung und Provision">
          <p>
            (1) Alle Preise verstehen sich in Euro und enthalten – soweit nicht anders ausgewiesen –
            die gesetzliche Umsatzsteuer. Bei Angeboten werden Netto-, Umsatzsteuer- und
            Bruttobetrag gesondert ausgewiesen.
          </p>
          <p>
            (2) Die Zahlungsabwicklung erfolgt – soweit angeboten – über den Zahlungsdienstleister
            Stripe. Es gelten ergänzend dessen Bedingungen.
          </p>
          <p>
            (3) Die Vergütung von Klard richtet sich nach dem Bereich und der Kategorie des Beraters.
            Bei buchungsbasierten Kategorien erhält Klard eine Provision auf das vermittelte Honorar:
            im Bereich Beratung &amp; Bauwesen 14 % (Tarif Basic) bzw. 9 % (Tarif Premium), im Bereich
            Alltag &amp; Handwerk 15 % (Tarif Basic) bzw. 10 % (Tarif Premium). Bei Pay-per-Lead-Kategorien
            zahlt der Berater stattdessen eine feste Lead-Gebühr je vermittelter Anfrage (Beratung &amp;
            Bauwesen 15 € je Anfrage; Alltag &amp; Handwerk 6 €–15 € je Anfrage, je nach Fachbereich); eine
            Buchungsprovision fällt in diesem Fall nicht an. Für den Kunden entstehen durch die Nutzung
            der Plattform keine zusätzlichen Vermittlungsgebühren.
          </p>
          <p>
            (4) Für reglementierte Honorare (insbesondere nach RVG und StBVV – z. B. bei
            Rechtsanwälten, Steuerberatern, Notaren und Wirtschaftsprüfern) findet keine
            Zahlungsabwicklung über Klard statt. Die Abrechnung erfolgt direkt zwischen Berater und
            Nutzer nach den jeweils geltenden Gebührenordnungen.
          </p>
        </Section>

        <Section n="§ 6" title="KI-Angebote und Festpreise">
          <p>
            (1) Klard kann mithilfe automatisierter Verfahren (KI) eine Bedarfsanalyse und einen
            Angebotsvorschlag erstellen. Diese dienen der Orientierung und ersetzen keine
            individuelle fachliche Beratung.
          </p>
          <p>
            (2) Maßgeblich für den Vertragsschluss sind ausschließlich die im verbindlichen Angebot
            ausgewiesenen, vom Berater hinterlegten Festpreise der ausgewählten Leistungen.
          </p>
          <p>
            (3) Ergibt sich nach Annahme ein offensichtlich abweichender tatsächlicher Aufwand, kann
            der Berater dem Nutzer ein gesondertes Anschlussangebot unterbreiten, das einer erneuten
            Annahme bedarf.
          </p>
        </Section>

        <Section n="§ 7" title="Stornierung und Widerrufsrecht (Verbraucher)">
          <p>
            (1) Stornierungsbedingungen für Termine werden vom jeweiligen Berater festgelegt und am
            Profil bzw. im Angebot ausgewiesen.
          </p>
          <p>
            (2) Verbrauchern steht bei im Fernabsatz geschlossenen Verträgen ein gesetzliches
            Widerrufsrecht nach §§ 312g, 355 BGB zu. Die Widerrufsfrist beträgt vierzehn Tage ab
            Vertragsschluss.
          </p>
          <p>
            (3) Verlangt der Verbraucher ausdrücklich, dass die Beratungsleistung bereits vor Ablauf
            der Widerrufsfrist beginnt, hat er bei Widerruf Wertersatz für die bis dahin erbrachten
            Leistungen zu leisten (§ 357 Abs. 8 BGB). Das Widerrufsrecht erlischt bei vollständig
            erbrachter Dienstleistung, wenn der Verbraucher dem Beginn vor Ablauf der Frist
            ausdrücklich zugestimmt und seine Kenntnis vom Erlöschen bestätigt hat.
          </p>
          <p>
            (4) Zur Ausübung des Widerrufs genügt eine eindeutige Erklärung gegenüber dem Berater.
          </p>
        </Section>

        <Section n="§ 8" title="Besondere Pflichten der Berater">
          <p>
            (1) Berater versichern, zur Erbringung der angebotenen Leistungen berechtigt und – soweit
            erforderlich – behördlich zugelassen bzw. kammerzugehörig zu sein (z. B. Rechtsanwalts-,
            Steuerberater-, Wirtschaftsprüferkammer).
          </p>
          <p>
            (2) Berater verpflichten sich zu wahrheitsgemäßen Angaben zu Qualifikation, Standort,
            Leistungen, Preisen und Verfügbarkeiten und halten diese aktuell.
          </p>
          <p>
            (3) Hinterlegte Festpreise sind verbindlich. Nimmt ein Nutzer ein Angebot an, ist der
            Berater zur Erbringung der Leistung zu den angenommenen Konditionen verpflichtet, sofern
            kein gesetzlicher oder vertraglicher Ausschlussgrund vorliegt.
          </p>
          <p>
            (4) Berater stellen sicher, dass ihre Angebote und Inhalte keine Rechte Dritter verletzen
            und gesetzliche sowie berufsrechtliche Vorgaben (insb. Preis- und Werberecht) einhalten.
          </p>
          <p>
            (5) Berater rechnen reglementierte Honorare eigenverantwortlich nach den einschlägigen
            Gebührenordnungen ab und führen anfallende Steuern selbst ab.
          </p>
        </Section>

        <Section n="§ 9" title="Premium-Mitgliedschaft (Berater)">
          <p>
            (1) Berater können eine kostenpflichtige Premium-Mitgliedschaft abschließen. Der Preis
            richtet sich nach dem Bereich: 89 €/Monat im Bereich Beratung &amp; Bauwesen, 69 €/Monat im
            Bereich Alltag &amp; Handwerk. Die Mitgliedschaft umfasst u. a. eine reduzierte Buchungsprovision
            (9 % bzw. 10 % je nach Bereich), KI-Werkzeuge, Kalendersynchronisation und eine bevorzugte
            Platzierung.
          </p>
          <p>
            (2) Die Mitgliedschaft verlängert sich automatisch um jeweils einen Monat und ist zum
            Ende des jeweiligen Abrechnungszeitraums kündbar.
          </p>
          <p>
            (3) Die Abrechnung erfolgt über Stripe. Bereits gezahlte Beiträge für einen laufenden
            Abrechnungszeitraum werden bei Kündigung nicht anteilig erstattet, soweit gesetzlich
            zulässig.
          </p>
        </Section>

        <Section n="§ 10" title="Bewertungen und Inhalte">
          <p>
            (1) Bewertungen sind nur nach einer tatsächlich erfolgten Buchung bzw. Angebotsannahme
            möglich. Bewertungen müssen sachlich und wahrheitsgemäß sein.
          </p>
          <p>
            (2) Klard ist berechtigt, rechtswidrige, beleidigende oder offensichtlich unwahre
            Inhalte zu entfernen.
          </p>
          <p>
            (3) Für von Nutzern oder Beratern eingestellte Inhalte räumen diese Klard ein
            einfaches, zur Plattformdarstellung erforderliches Nutzungsrecht ein.
          </p>
        </Section>

        <Section n="§ 11" title="Haftung">
          <p>
            (1) Klard haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus
            der Verletzung des Lebens, des Körpers oder der Gesundheit.
          </p>
          <p>
            (2) Für leichte Fahrlässigkeit haftet Klard nur bei Verletzung einer wesentlichen
            Vertragspflicht (Kardinalpflicht) und begrenzt auf den vertragstypischen,
            vorhersehbaren Schaden.
          </p>
          <p>
            (3) Klard haftet nicht für Qualität, Rechtmäßigkeit, Verfügbarkeit oder Erfolg der durch
            Berater erbrachten Leistungen. Insoweit ist allein der jeweilige Berater verantwortlich.
          </p>
          <p>
            (4) Die Angaben des Gebäudecheck-/Analyse-Tools und etwaiger Kennzahlen erfolgen ohne
            Gewähr und ersetzen keine fachliche Prüfung.
          </p>
        </Section>

        <Section n="§ 12" title="Datenschutz">
          <p>
            Die Verarbeitung personenbezogener Daten richtet sich nach der Datenschutzerklärung von
            Klard sowie den geltenden datenschutzrechtlichen Bestimmungen (insb. DSGVO und BDSG).
          </p>
        </Section>

        <Section n="§ 13" title="Laufzeit und Kündigung des Nutzungsverhältnisses">
          <p>
            (1) Das Nutzungsverhältnis über die Plattform wird auf unbestimmte Zeit geschlossen und
            kann von beiden Seiten jederzeit ohne Angabe von Gründen beendet werden, soweit keine
            offenen Verpflichtungen bestehen.
          </p>
          <p>
            (2) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
            Bereits geschlossene Beratungsverträge bleiben hiervon unberührt.
          </p>
        </Section>

        <Section n="§ 14" title="Streitbeilegung">
          <p>
            (1) Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            https://ec.europa.eu/consumers/odr.
          </p>
          <p>
            (2) Klard ist nicht verpflichtet und grundsätzlich nicht bereit, an einem
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </Section>

        <Section n="§ 15" title="Schlussbestimmungen">
          <p>
            (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
            Zwingende verbraucherschützende Vorschriften des Staates, in dem der Verbraucher seinen
            gewöhnlichen Aufenthalt hat, bleiben unberührt.
          </p>
          <p>
            (2) Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder
            öffentlich-rechtliches Sondervermögen, ist Gerichtsstand Berlin.
          </p>
          <p>
            (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die
            Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>
          <p>
            (4) Klard kann diese AGB mit Wirkung für die Zukunft ändern. Nutzer und Berater werden
            über Änderungen rechtzeitig informiert. Für bereits angenommene Angebote gilt die zum
            Zeitpunkt der Annahme gespeicherte Fassung.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground mt-10 border-t border-border pt-4">
          Hinweis: Diese AGB stellen eine Vorlage im Rahmen einer Produktdemonstration dar und
          ersetzen keine individuelle Rechtsberatung.
        </p>
      </main>
      <Footer />
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-serif font-semibold text-foreground">
        {n} {title}
      </h2>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}
