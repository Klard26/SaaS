import { SlideFrame } from "@/components/SlideFrame";

export default function Vision() {
  return (
    <SlideFrame
      section="VISION"
      page="14"
      dark
      title="Klard wird die Buchungsinfrastruktur für Fachberatung in Deutschland"
    >
      <div className="flex-1 flex flex-col justify-center gap-[5vh]">
        <p className="text-[3vw] font-light leading-[1.35] text-white/85 max-w-[74vw]">
          Vom Energieberater-Marktplatz zur branchenübergreifenden Plattform für
          Berater- und Alltagsleistungen – transparent, sofort buchbar und
          fördersicher.
        </p>

        <div className="border-t border-white/15 pt-[4vh]">
          <span className="text-[2.2vw] tracking-[0.26em] text-cyan font-semibold">
            KONTAKT
          </span>
          <div className="mt-[2.2vh] flex flex-wrap items-baseline gap-x-[3vw] gap-y-[1.4vh]">
            <span className="text-[3.2vw] font-bold text-white">
              Mürsel Demir
            </span>
            <span className="text-[2.7vw] text-white/80 [overflow-wrap:anywhere]">
              md@klard.de
            </span>
            <span className="text-[2.7vw] text-white/80">
              +49 160 3503150
            </span>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
