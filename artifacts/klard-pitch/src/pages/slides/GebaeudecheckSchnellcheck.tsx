export default function GebaeudecheckSchnellcheck() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">10 / 19</span>
        </div>

        <div className="mt-[6vh] grid grid-cols-2 gap-[6vw] items-center flex-1">
          <div>
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
              GEBÄUDECHECK · TEIL 1
            </span>
            <h2 className="mt-[1.5vh] text-[4vw] font-bold tracking-tight text-deep leading-[1.05] text-balance">
              Der kostenlose Schnellcheck
            </h2>
            <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
            <p className="mt-[4vh] text-[1.8vw] leading-relaxed text-text max-w-[34vw]">
              In unter einer Minute zu Energieklasse, Gebäudewert und
              Sanierungsbedarf. Führt direkt zu passenden Energieberatern.
            </p>
          </div>

          <div className="bg-card border border-line p-[2.6vw]">
            <div className="flex items-center justify-between">
              <span className="text-[1.5vw] text-muted">Energieklasse</span>
              <span className="text-[3vw] font-extrabold text-accent leading-none">D</span>
            </div>
            <div className="mt-[2.5vh] grid grid-cols-7 gap-[0.5vw]">
              <div className="h-[1.6vh] bg-primary/30" />
              <div className="h-[1.6vh] bg-primary/40" />
              <div className="h-[1.6vh] bg-primary/55" />
              <div className="h-[1.6vh] bg-accent" />
              <div className="h-[1.6vh] bg-primary/20" />
              <div className="h-[1.6vh] bg-primary/20" />
              <div className="h-[1.6vh] bg-primary/20" />
            </div>
            <div className="mt-[3.5vh] grid grid-cols-2 gap-[2vw] border-t border-line pt-[3vh]">
              <div>
                <div className="text-[1.5vw] text-muted">Gebäudewert</div>
                <div className="text-[2vw] font-semibold text-deep">~ 420.000 €</div>
              </div>
              <div>
                <div className="text-[1.5vw] text-muted">Sanierungsbedarf</div>
                <div className="text-[2vw] font-semibold text-deep">mittel</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
