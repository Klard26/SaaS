export default function Berufsgruppen() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">05 / 19</span>
        </div>

        <div className="mt-[5vh] flex items-end justify-between">
          <div>
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
              DAS ANGEBOT
            </span>
            <h2 className="mt-[1.5vh] text-[4.2vw] font-bold tracking-tight text-deep leading-[1.05]">
              Acht Berufsgruppen
            </h2>
            <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
          </div>
          <span className="text-[1.5vw] text-muted">Bau &amp; Gebäude, kuratiert</span>
        </div>

        <div className="mt-[6vh] grid grid-cols-4 grid-rows-2 gap-[1.6vw] flex-1">
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-between">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">01</span>
            <span className="text-[1.8vw] font-semibold text-deep leading-tight break-words">Energieberatung</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-between">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">02</span>
            <span className="text-[1.8vw] font-semibold text-deep leading-tight break-words">Architektur</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-between">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">03</span>
            <span className="text-[1.8vw] font-semibold text-deep leading-tight break-words">Statiker / Tragwerksplaner</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-between">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">04</span>
            <span className="text-[1.8vw] font-semibold text-deep leading-tight break-words">Bauberatung / Baubegleitung</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-between">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">05</span>
            <span className="text-[1.8vw] font-semibold text-deep leading-tight break-words">Gebäudesachverständige</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-between">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">06</span>
            <span className="text-[1.8vw] font-semibold text-deep leading-tight break-words">Vermesser / Geodäten</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-between">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">07</span>
            <span className="text-[1.8vw] font-semibold text-deep leading-tight break-words">TGA-Fachplaner</span>
          </div>
          <div className="bg-deep p-[1.6vw] flex flex-col justify-between">
            <span className="text-[1.5vw] tracking-[0.2em] text-accent font-semibold">08</span>
            <span className="text-[1.8vw] font-semibold text-white leading-tight break-words">Bauphysik &amp; Spezialberatung</span>
          </div>
        </div>
      </div>
    </div>
  );
}
