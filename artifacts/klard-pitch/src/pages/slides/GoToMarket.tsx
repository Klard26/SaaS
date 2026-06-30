import { SlideFrame } from "@/components/SlideFrame";

function Phase({
  tag,
  title,
  text,
  active = false,
}: {
  tag: string;
  title: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={
        "p-[2.2vw] rounded-[0.6vw] flex flex-col border " +
        (active ? "bg-bluesoft border-primary" : "bg-card border-line")
      }
    >
      <span
        className={
          "text-[2vw] tracking-[0.14em] font-semibold " +
          (active ? "text-primary" : "text-muted")
        }
      >
        {tag}
      </span>
      <h3 className="mt-[1.6vh] text-[2.6vw] font-semibold text-deep leading-[1.15] [hyphens:auto]">
        {title}
      </h3>
      <p className="mt-[1.6vh] text-[2.4vw] leading-[1.3] text-muted">{text}</p>
    </div>
  );
}

export default function GoToMarket() {
  return (
    <SlideFrame
      section="GO-TO-MARKET"
      page="09"
      title="Wir starten mit Energieberatung und skalieren entlang weiterer Branchen"
      source="Skalierung über Angebot (Berater) und Nachfrage (Eigentümer)."
    >
      <div className="grid grid-cols-3 gap-[2.4vw] flex-1 items-center">
        <Phase
          active
          tag="PHASE 1 · JETZT"
          title="Energieberatung"
          text="Drei Unternehmen unter Vertrag, Pilotstart in Vorbereitung."
        />
        <Phase
          tag="PHASE 2 · NÄCHSTES"
          title="Bau- & Fachberatung"
          text="Architektur, Statik, TGA und Sachverständige."
        />
        <Phase
          tag="PHASE 3 · SKALIERUNG"
          title="Alltag & weitere Branchen"
          text="Plattform unterstützt bereits 78 Kategorien."
        />
      </div>
    </SlideFrame>
  );
}
