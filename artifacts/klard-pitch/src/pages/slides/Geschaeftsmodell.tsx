import { SlideFrame } from "@/components/SlideFrame";

function Source({
  no,
  name,
  children,
}: {
  no: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-line p-[2.2vw] rounded-[0.6vw] flex flex-col">
      <span className="text-[2.2vw] tracking-[0.2em] text-primary font-semibold">
        {no}
      </span>
      <h3 className="mt-[1.8vh] text-[2.6vw] font-semibold text-deep leading-[1.15]">
        {name}
      </h3>
      <div className="mt-[2.4vh] flex-1 flex flex-col justify-end">
        {children}
      </div>
    </div>
  );
}

export default function Geschaeftsmodell() {
  return (
    <SlideFrame
      section="GESCHÄFTSMODELL"
      page="08"
      title="Klard verdient an drei sich ergänzenden Erlösströmen"
      source="Preise serverseitig berechnet; Stand 2026."
    >
      <div className="grid grid-cols-3 gap-[2.4vw] flex-1 items-stretch">
        <Source no="QUELLE 01" name="Provision pro Buchung">
          <div className="flex items-end gap-[1.6vw]">
            <span className="text-[3.6vw] font-extrabold text-deep leading-none">
              9–14 %
            </span>
          </div>
          <p className="mt-[1.4vh] text-[2.3vw] leading-[1.3] text-muted">
            Beratung &amp; Bau · 10–15 % für Alltag &amp; Handwerk.
          </p>
        </Source>
        <Source no="QUELLE 02" name="Pay-per-Lead">
          <span className="text-[3.6vw] font-extrabold text-deep leading-none">
            6–15 €
          </span>
          <p className="mt-[1.4vh] text-[2.3vw] leading-[1.3] text-muted">
            pro qualifizierter Anfrage, je nach Kategorie.
          </p>
        </Source>
        <Source no="QUELLE 03" name="Premium-Abonnement">
          <div className="flex items-end gap-[1vw]">
            <span className="text-[3.6vw] font-extrabold text-accent leading-none">
              89 € / 69 €
            </span>
          </div>
          <p className="mt-[1.4vh] text-[2.3vw] leading-[1.3] text-muted">
            pro Monat · Pro- bzw. Alltag-Berater. Planbare, wiederkehrende
            Umsätze.
          </p>
        </Source>
      </div>
    </SlideFrame>
  );
}
