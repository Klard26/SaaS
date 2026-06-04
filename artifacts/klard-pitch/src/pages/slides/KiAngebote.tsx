export default function KiAngebote() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-display">
      <div className="absolute inset-0 blueprint-grid pointer-events-none" />
      <div className="absolute top-0 left-0 h-full w-[34vw] bg-tealsoft pointer-events-none" />

      <div className="relative h-full px-[8vw] py-[7vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.8vw]">
            <div className="w-[1.1vw] h-[1.1vw] bg-primary" />
            <span className="text-[1.5vw] tracking-[0.4em] text-muted font-semibold">
              KLARD
            </span>
          </div>
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">09 / 19</span>
        </div>

        <div className="mt-[8vh] grid grid-cols-2 gap-[6vw] items-center flex-1">
          <div>
            <span className="inline-block px-[1.2vw] py-[0.7vh] bg-accent text-white text-[1.5vw] font-semibold tracking-wide">
              PREMIUM-FUNKTION
            </span>
            <h2 className="mt-[2.5vh] text-[4.2vw] font-bold tracking-tight text-deep leading-[1.05]">
              KI-Angebote
            </h2>
            <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
            <p className="mt-[4vh] text-[1.85vw] leading-relaxed text-text max-w-[34vw]">
              Auf Knopfdruck individuelle Angebotsentwürfe – erstellt mit
              Anthropic Claude.
            </p>
          </div>

          <div className="bg-card border border-line p-[2.6vw]">
            <p className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
              ANGEBOTSENTWURF
            </p>
            <p className="mt-[2.5vh] font-serif text-[1.85vw] leading-[1.4] text-deep">
              „Energieberatung für ein Einfamilienhaus, Baujahr 1985, inkl.
              Vor-Ort-Termin und individuellem Sanierungsfahrplan …“
            </p>
            <div className="mt-[3.5vh] flex items-center gap-[2.5vw] border-t border-line pt-[3vh]">
              <div>
                <div className="text-[1.5vw] text-muted">Berater</div>
                <div className="text-[1.6vw] font-semibold text-deep">spart Zeit</div>
              </div>
              <div className="w-px h-[5vh] bg-line" />
              <div>
                <div className="text-[1.5vw] text-muted">Kunde</div>
                <div className="text-[1.6vw] font-semibold text-deep">schneller informiert</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
