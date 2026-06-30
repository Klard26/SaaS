import { SlideFrame, Bullet } from "@/components/SlideFrame";

export default function Traktion() {
  return (
    <SlideFrame
      section="STATUS & TRAKTION"
      page="11"
      title="MVP ist live, die ersten drei Energieberatungsunternehmen sind unter Vertrag"
      source="Stand: intern, Juni 2026 (Pre-Launch)."
    >
      <div className="grid grid-cols-[1.45fr_1fr] gap-[4vw] flex-1 items-center">
        <ul className="flex flex-col gap-[2.6vh]">
          <Bullet>
            Marktplatz live: Buchung, Zahlung, KI-Analyse und Kalender.
          </Bullet>
          <Bullet>
            Drei Unternehmen sind vertraglich gebunden.
          </Bullet>
          <Bullet>
            Absichtserklärungen aus weiteren Branchen liegen vor.
          </Bullet>
          <Bullet>
            Nächster Schritt: Pilotstart und erste Buchungen.
          </Bullet>
        </ul>
        <div className="bg-card border border-line p-[2.4vw] rounded-[0.6vw]">
          <div className="text-[6.5vw] font-extrabold klard-text-gradient leading-none">
            3
          </div>
          <div className="mt-[1.6vh] text-[2.3vw] leading-[1.3] text-muted">
            Energieberatungs­unternehmen unter Vertrag.
          </div>
          <div className="mt-[2.2vh] inline-block bg-green/10 text-green text-[2.2vw] font-semibold px-[1.4vw] py-[0.8vh] rounded-[0.4vw]">
            MVP live
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
