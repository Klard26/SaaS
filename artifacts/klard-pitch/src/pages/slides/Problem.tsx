export default function Problem() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">02 / 19</span>
        </div>

        <div className="mt-[7vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            DIE AUSGANGSLAGE
          </span>
          <h2 className="mt-[1.5vh] text-[4.4vw] font-bold tracking-tight text-deep leading-[1.05] max-w-[62vw] text-balance">
            Die Suche nach Baufachberatern ist mühsam.
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[7vh] grid grid-cols-3 gap-[2.5vw]">
          <div className="bg-card border border-line p-[2.6vw]">
            <div className="text-[2.4vw] font-bold text-accent">01</div>
            <p className="mt-[2vh] text-[1.6vw] leading-snug text-text">
              Keine zentrale Suche über Architekten, Energieberater, Statiker und
              Co.
            </p>
          </div>
          <div className="bg-card border border-line p-[2.6vw]">
            <div className="text-[2.4vw] font-bold text-accent">02</div>
            <p className="mt-[2vh] text-[1.6vw] leading-snug text-text">
              Lange Wartezeiten und endloses Telefon- und E-Mail-Pingpong.
            </p>
          </div>
          <div className="bg-card border border-line p-[2.6vw]">
            <div className="text-[2.4vw] font-bold text-accent">03</div>
            <p className="mt-[2vh] text-[1.6vw] leading-snug text-text">
              Intransparente Preise und unklare Qualifikationen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
