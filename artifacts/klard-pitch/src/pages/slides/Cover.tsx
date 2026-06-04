export default function Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-deep text-white font-display">
      <div className="absolute inset-0 blueprint-grid-dark pointer-events-none" />
      <div className="absolute top-0 right-0 w-[36vw] h-[36vw] rounded-full bg-primary/20 blur-[8vw] pointer-events-none" />
      <div className="absolute -bottom-[10vw] -left-[6vw] w-[30vw] h-[30vw] rounded-full bg-accent/10 blur-[7vw] pointer-events-none" />

      <div className="relative h-full px-[8vw] py-[8vh] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.9vw]">
            <div className="w-[1.3vw] h-[1.3vw] bg-accent" />
            <span className="text-[1.5vw] tracking-[0.4em] font-semibold text-white/80">
              KLARD
            </span>
          </div>
          <span className="text-[1.5vw] tracking-[0.3em] text-white/55">
            PITCH DECK · 2026
          </span>
        </div>

        <div className="max-w-[72vw]">
          <p className="font-serif italic text-[2vw] text-primary/90 mb-[2.5vh]">
            Der Marktplatz für Baufachberatung
          </p>
          <h1 className="text-[10vw] font-extrabold tracking-tighter leading-[0.92]">
            Klard
          </h1>
          <div className="mt-[3vh] w-[12vw] h-[0.6vh] bg-accent" />
          <p className="mt-[4vh] text-[2.2vw] font-light leading-[1.3] text-white/85 max-w-[58vw] text-balance">
            Bau- und Gebäudeberater finden, vergleichen und sofort online buchen.
          </p>
        </div>

        <div className="flex items-end justify-between">
          <p className="text-[1.5vw] text-white/60 max-w-[40vw] leading-snug">
            Der digitale Marktplatz für qualifizierte Baufachberatung in
            Deutschland.
          </p>
          <span className="text-[1.5vw] tracking-[0.3em] text-white/45">
            01 / 19
          </span>
        </div>
      </div>
    </div>
  );
}
