export default function SoFunktioniert() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-display">
      <div className="absolute inset-0 blueprint-grid pointer-events-none" />

      <div className="relative h-full px-[8vw] py-[7vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.8vw]">
            <div className="w-[1.1vw] h-[1.1vw] bg-primary" />
            <span className="text-[1.5vw] tracking-[0.4em] text-muted font-semibold">
              KLARD
            </span>
          </div>
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">04 / 19</span>
        </div>

        <div className="mt-[6vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            DER ABLAUF
          </span>
          <h2 className="mt-[1.5vh] text-[4.2vw] font-bold tracking-tight text-deep leading-[1.05]">
            So funktioniert Klard
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[7vh] grid grid-cols-4 gap-[2vw] flex-1 items-stretch">
          <div className="bg-card border border-line p-[2vw] flex flex-col">
            <span className="text-[3.4vw] font-extrabold text-primary leading-none">1</span>
            <h3 className="mt-[3vh] text-[1.9vw] font-semibold text-deep">Suchen</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-muted">
              Nach Ort, Kategorie und Preis.
            </p>
          </div>
          <div className="bg-card border border-line p-[2vw] flex flex-col">
            <span className="text-[3.4vw] font-extrabold text-primary leading-none">2</span>
            <h3 className="mt-[3vh] text-[1.9vw] font-semibold text-deep">Vergleichen</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-muted">
              Profile, Bewertungen und Leistungen.
            </p>
          </div>
          <div className="bg-card border border-line p-[2vw] flex flex-col">
            <span className="text-[3.4vw] font-extrabold text-primary leading-none">3</span>
            <h3 className="mt-[3vh] text-[1.9vw] font-semibold text-deep">Buchen</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-muted">
              Freie Slots in Echtzeit auswählen.
            </p>
          </div>
          <div className="bg-deep p-[2vw] flex flex-col">
            <span className="text-[3.4vw] font-extrabold text-accent leading-none">4</span>
            <h3 className="mt-[3vh] text-[1.9vw] font-semibold text-white">Bezahlen</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-white/70">
              Inklusive Rechnung – online abgewickelt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
