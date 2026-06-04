export default function Leistungskatalog() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-deep text-white font-display">
      <div className="absolute inset-0 blueprint-grid-dark pointer-events-none" />
      <div className="absolute -top-[8vw] -right-[6vw] w-[34vw] h-[34vw] rounded-full bg-primary/15 blur-[8vw] pointer-events-none" />

      <div className="relative h-full px-[8vw] py-[7vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.8vw]">
            <div className="w-[1.1vw] h-[1.1vw] bg-accent" />
            <span className="text-[1.5vw] tracking-[0.4em] text-white/70 font-semibold">
              KLARD
            </span>
          </div>
          <span className="text-[1.5vw] tracking-[0.3em] text-white/55">06 / 19</span>
        </div>

        <div className="mt-[4vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            DER LEISTUNGSKATALOG
          </span>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-[5vw] items-center">
          <div>
            <div className="flex items-end gap-[1.5vw]">
              <span className="text-[13vw] font-extrabold text-accent leading-[0.8] tracking-tighter">
                153
              </span>
              <span className="text-[2vw] text-white/70 mb-[2vh] leading-tight max-w-[14vw]">
                standardisierte Leistungen
              </span>
            </div>
            <p className="mt-[3vh] text-[2vw] text-white/85 leading-snug max-w-[34vw]">
              In acht Kategorien – vergleichbar statt undurchsichtig.
            </p>
          </div>
          <div className="border-l border-white/15 pl-[4vw]">
            <p className="text-[1.9vw] leading-relaxed text-white/85 text-balance">
              Strukturiert nach HOAI, BAFA und KfW – jede Leistung mit
              Referenzpreis und Dauer.
            </p>
            <div className="mt-[5vh] flex items-center gap-[3vw]">
              <div>
                <div className="text-[3.4vw] font-bold text-white leading-none">8</div>
                <div className="mt-[1vh] text-[1.5vw] text-white/60">Kategorien</div>
              </div>
              <div className="w-px h-[7vh] bg-white/15" />
              <div>
                <div className="text-[3.4vw] font-bold text-white leading-none">HOAI</div>
                <div className="mt-[1vh] text-[1.5vw] text-white/60">BAFA · KfW</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
