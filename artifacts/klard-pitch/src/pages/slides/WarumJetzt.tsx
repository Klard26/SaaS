import { SlideFrame, Bullet } from "@/components/SlideFrame";

export default function WarumJetzt() {
  return (
    <SlideFrame
      section="WARUM JETZT"
      page="05"
      title="Regulatorik und Förderung machen professionelle Fachberatung zur Pflicht"
      source="Quellen: BAFA/KfW (2024), dena, VDI-/IW-Ingenieurmonitor."
    >
      <div className="grid grid-cols-[1.4fr_1fr] gap-[4vw] flex-1 items-center">
        <ul className="flex flex-col gap-[2.6vh]">
          <Bullet>
            GEG und Förderung verlangen zertifizierte Fachberatung.
          </Bullet>
          <Bullet>
            Über 9 Mio. Gebäude sind sanierungsbedürftig.
          </Bullet>
          <Bullet>
            Fachkräftemangel verknappt die Berater-Kapazität.
          </Bullet>
          <Bullet>
            Eigentümer erwarten Online-Buchung wie bei Arzt und Reise.
          </Bullet>
        </ul>
        <div className="bg-card border border-line p-[2.4vw] rounded-[0.6vw]">
          <div className="text-[5vw] font-extrabold text-deep leading-none">
            ≈ 3 Mrd. €
          </div>
          <div className="mt-[1.6vh] text-[2.3vw] leading-[1.3] text-muted">
            BAFA-Auszahlungen für Einzelmaßnahmen der Gebäudeförderung 2024.
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
