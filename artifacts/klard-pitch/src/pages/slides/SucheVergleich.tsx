export default function SucheVergleich() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">07 / 19</span>
        </div>

        <div className="mt-[6vh] grid grid-cols-2 gap-[6vw] items-center flex-1">
          <div>
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
              FUNKTION
            </span>
            <h2 className="mt-[1.5vh] text-[4.2vw] font-bold tracking-tight text-deep leading-[1.05]">
              Suche &amp; Vergleich
            </h2>
            <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
            <p className="mt-[4vh] text-[1.85vw] leading-relaxed text-text max-w-[34vw]">
              Filter nach Stadt oder PLZ, Kategorie und Preisspanne. Alle
              passenden Treffer auf einen Blick.
            </p>
          </div>

          <div className="bg-card border border-line p-[2.4vw]">
            <div className="flex items-center justify-between border-b border-line pb-[2vh]">
              <span className="text-[1.5vw] font-semibold text-deep">Energieberatung · München</span>
              <span className="text-[1.5vw] text-muted">42 Treffer</span>
            </div>
            <div className="mt-[2.5vh] flex items-center justify-between">
              <div>
                <div className="text-[1.7vw] font-semibold text-deep">EnergiePlus GmbH</div>
                <div className="text-[1.5vw] text-muted">ab 1.450 € · Bewertung 4,9</div>
              </div>
              <span className="px-[1.2vw] py-[0.7vh] bg-accent text-white text-[1.5vw] font-semibold">Premium</span>
            </div>
            <div className="mt-[2.5vh] flex items-center justify-between border-t border-line pt-[2.5vh]">
              <div>
                <div className="text-[1.7vw] font-semibold text-deep">Bauwerk Beratung</div>
                <div className="text-[1.5vw] text-muted">ab 1.180 € · Bewertung 4,7</div>
              </div>
              <span className="px-[1.2vw] py-[0.7vh] border border-line text-muted text-[1.5vw] font-semibold">Basic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
