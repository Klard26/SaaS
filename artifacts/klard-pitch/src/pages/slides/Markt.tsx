import { SlideFrame } from "@/components/SlideFrame";

function Bar({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-end justify-between mb-[0.8vh]">
        <span className="text-[2.4vw] text-text">{label}</span>
        <span className="text-[2.4vw] font-bold text-deep">{value}</span>
      </div>
      <div className="h-[2.4vh] w-full bg-bluesoft rounded-[0.3vw] overflow-hidden">
        <div
          className="h-full klard-gradient rounded-[0.3vw]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-[0.4vw] border-primary pl-[1.6vw]">
      <div className="text-[3.8vw] font-extrabold text-deep leading-none">
        {value}
      </div>
      <div className="mt-[1vh] text-[2.2vw] leading-[1.26] text-muted">
        {label}
      </div>
    </div>
  );
}

export default function Markt() {
  return (
    <SlideFrame
      section="MARKT"
      page="04"
      title="Ein 84-Mrd.-Markt mit über 160.000 Anbietern steht unter Sanierungsdruck"
      source="Quellen: BAK, dena, Destatis, Bundesagentur für Arbeit."
    >
      <div className="grid grid-cols-2 gap-[5vw] flex-1 items-center">
        <div className="flex flex-col gap-[3vh]">
          <Bar label="Architekten" value="142.347" pct={100} />
          <Bar label="Bauingenieure" value="~95.000" pct={67} />
          <Bar label="Energie-Effizienz-Experten" value="22.800" pct={16} />
        </div>
        <div className="flex flex-col gap-[2.6vh]">
          <Stat value="84 Mrd. €" label="Jahresumsatz Architektur- & Ingenieurbüros" />
          <Stat value="0,67 %" label="Sanierungsrate 2025 (Ziel: 1,7–2 %)" />
          <Stat value="> 9 Mio." label="sanierungsbedürftige Wohngebäude" />
        </div>
      </div>
    </SlideFrame>
  );
}
