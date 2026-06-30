import { SlideFrame } from "@/components/SlideFrame";

function Row({
  label,
  children,
  first = false,
}: {
  label: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div
      className={
        "flex gap-[1.8vw] items-baseline py-[1.7vh] " +
        (first ? "" : "border-t border-line")
      }
    >
      <span className="w-[13vw] flex-none text-[2.6vw] font-bold text-primary">
        {label}
      </span>
      <span className="text-[2.6vw] leading-[1.3] text-text">{children}</span>
    </div>
  );
}

export default function ExecutiveSummary() {
  return (
    <SlideFrame
      section="ÜBERBLICK"
      page="02"
      title="Klard macht qualifizierte Fachberatung und Alltagsdienstleistungen erstmals online buchbar"
      source="Quellen: Bundesarchitektenkammer (01/2026), dena, Destatis."
    >
      <div className="flex flex-col justify-center flex-1">
        <Row label="Problem" first>
          Beratersuche ist analog, langsam und intransparent.
        </Row>
        <Row label="Lösung">
          Suche, Buchung und Zahlung auf einer Plattform.
        </Row>
        <Row label="Markt">
          84 Mrd. € Umsatz, über 160.000 Anbieter.
        </Row>
        <Row label="Status">
          MVP live, drei Unternehmen unter Vertrag.
        </Row>
        <Row label="Ask">
          750.000 € Pre-Seed für 18 Monate.
        </Row>
      </div>
    </SlideFrame>
  );
}
