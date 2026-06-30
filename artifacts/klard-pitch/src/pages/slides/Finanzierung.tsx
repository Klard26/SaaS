import { SlideFrame } from "@/components/SlideFrame";

function UseBar({
  label,
  amount,
  pct,
}: {
  label: string;
  amount: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-[1vw] mb-[0.7vh]">
        <span className="text-[2.2vw] text-text whitespace-nowrap">{label}</span>
        <span className="text-[2.2vw] font-semibold text-deep whitespace-nowrap">
          {pct} % · {amount}
        </span>
      </div>
      <div className="h-[2vh] w-full bg-bluesoft rounded-[0.3vw] overflow-hidden">
        <div
          className="h-full klard-gradient rounded-[0.3vw]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Finanzierung() {
  return (
    <SlideFrame
      section="FINANZIERUNG"
      page="13"
      title="Wir raisen 750.000 € für 18 Monate Wachstum"
      source="Mittelverwendung – Planung, anpassbar."
    >
      <div className="grid grid-cols-[1fr_1.25fr] gap-[4vw] flex-1 items-center">
        <div>
          <div className="text-[6vw] font-extrabold text-accent leading-none">
            750.000 €
          </div>
          <div className="mt-[1.6vh] text-[2.5vw] font-semibold text-deep">
            Pre-Seed · 18 Monate Runway
          </div>
          <p className="mt-[2.4vh] text-[2.3vw] leading-[1.34] text-muted">
            Ziel: Pilot in mehreren Regionen, skalierte Berater-Akquise und
            erste wiederkehrende Umsätze.
          </p>
        </div>
        <div className="flex flex-col gap-[2.4vh]">
          <UseBar label="Produktentwicklung" amount="300.000 €" pct={40} />
          <UseBar label="Vertrieb & Akquise" amount="187.500 €" pct={25} />
          <UseBar label="Marketing & Nachfrage" amount="150.000 €" pct={20} />
          <UseBar label="Betrieb & Ausstattung" amount="75.000 €" pct={10} />
          <UseBar label="Puffer" amount="37.500 €" pct={5} />
        </div>
      </div>
    </SlideFrame>
  );
}
