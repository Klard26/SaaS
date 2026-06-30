import { SlideFrame, LeadBullet } from "@/components/SlideFrame";

export default function Problem() {
  return (
    <SlideFrame
      section="PROBLEM"
      page="03"
      title="Qualifizierte Fachberatung zu finden ist langsam, analog und intransparent"
      source="Quellen: BEG-Förderbedingungen (BAFA/KfW), dena, Branchengespräche."
    >
      <ul className="flex flex-col gap-[3vh] justify-center flex-1">
        <LeadBullet lead="Mühsame Suche:">
          Empfehlungen und Telefonlisten.
        </LeadBullet>
        <LeadBullet lead="Keine Transparenz:">
          Preise, Termine und Bewertungen sind kaum vergleichbar.
        </LeadBullet>
        <LeadBullet lead="Lange Wartezeiten:">
          Erstkontakt und Angebot laufen per Telefon.
        </LeadBullet>
        <LeadBullet lead="Verschenkte Förderung:">
          BAFA-/KfW-Mittel bleiben ungenutzt.
        </LeadBullet>
        <LeadBullet lead="Leerlauf bei Beratern:">
          Anfragen statt Mandate.
        </LeadBullet>
      </ul>
    </SlideFrame>
  );
}
