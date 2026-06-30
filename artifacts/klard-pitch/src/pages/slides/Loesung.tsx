import { SlideFrame, LeadBullet } from "@/components/SlideFrame";

export default function Loesung() {
  return (
    <SlideFrame
      section="LÖSUNG"
      page="06"
      title="Klard bucht Fachberatung online wie einen Arzttermin"
      source="Eine Plattform für Eigentümer, Unternehmen und Berater."
    >
      <ul className="flex flex-col gap-[2.8vh] justify-center flex-1">
        <LeadBullet lead="Suchen:">
          nach Kategorie, Standort und Verfügbarkeit filtern.
        </LeadBullet>
        <LeadBullet lead="Vergleichen:">
          Profile, Preise und echte Bewertungen auf einen Blick.
        </LeadBullet>
        <LeadBullet lead="Buchen:">
          freie Termine in Echtzeit verbindlich online sichern.
        </LeadBullet>
        <LeadBullet lead="KI-Bedarfsanalyse:">
          passende Leistungen automatisch vorgeschlagen.
        </LeadBullet>
        <LeadBullet lead="Bezahlen:">
          abgesichert zahlen und gesetzeskonforme Rechnung erhalten.
        </LeadBullet>
      </ul>
    </SlideFrame>
  );
}
