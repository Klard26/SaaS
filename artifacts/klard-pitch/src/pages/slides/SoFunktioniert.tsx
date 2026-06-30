import { SlideFrame } from "@/components/SlideFrame";

function Step({
  no,
  title,
  text,
}: {
  no: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[4.4vw] font-extrabold klard-text-gradient leading-none">
        {no}
      </span>
      <div className="mt-[2vh] w-[3vw] h-[0.5vh] bg-primary" />
      <h3 className="mt-[2vh] text-[2.7vw] font-semibold text-deep leading-[1.15]">
        {title}
      </h3>
      <p className="mt-[1.4vh] text-[2.4vw] leading-[1.32] text-muted">{text}</p>
    </div>
  );
}

export default function SoFunktioniert() {
  return (
    <SlideFrame
      section="SO FUNKTIONIERT KLARD"
      page="07"
      title="Vier Schritte führen vom Bedarf zur gebuchten Beratung"
      source="Durchgängiger Ablauf – ohne Medienbruch."
    >
      <div className="grid grid-cols-4 gap-[3vw] flex-1 items-center">
        <Step
          no="01"
          title="Suchen"
          text="Bedarf eingeben und passende Berater in der Region finden."
        />
        <Step
          no="02"
          title="Vergleichen"
          text="Preise, Profile und Bewertungen direkt gegenüberstellen."
        />
        <Step
          no="03"
          title="Buchen"
          text="Freien Termin in Echtzeit wählen und verbindlich sichern."
        />
        <Step
          no="04"
          title="Bezahlen"
          text="Sicher zahlen und gesetzeskonforme Rechnung erhalten."
        />
      </div>
    </SlideFrame>
  );
}
