export default function Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-deep text-white font-display">
      <div className="absolute inset-0 blueprint-grid-dark pointer-events-none" />
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-primary/25 blur-[9vw] pointer-events-none" />
      <div className="absolute -bottom-[12vw] -left-[8vw] w-[34vw] h-[34vw] rounded-full bg-cyan/15 blur-[8vw] pointer-events-none" />

      <div className="relative h-full px-[8vw] py-[8vh] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.9vw]">
            <div className="w-[1.3vw] h-[1.3vw] klard-gradient" />
            <span className="text-[2.2vw] tracking-[0.4em] font-semibold text-white/80">
              KLARD
            </span>
          </div>
          <span className="text-[2.2vw] tracking-[0.3em] text-white/55">
            INVESTOREN-PITCH · 2026
          </span>
        </div>

        <div className="max-w-[80vw]">
          <p className="font-serif italic text-[2.6vw] text-white/75 mb-[2.5vh]">
            Der Online-Marktplatz für Fachberatung und Alltagsdienstleistungen
          </p>
          <h1 className="text-[12vw] font-extrabold tracking-tighter leading-[0.9] klard-text-gradient">
            Klard
          </h1>
          <div className="mt-[3vh] w-[14vw] h-[0.7vh] klard-gradient" />
          <p className="mt-[4vh] text-[3vw] font-light leading-[1.3] text-white/85 max-w-[66vw] text-balance">
            Berater finden, vergleichen und sofort online buchen.
          </p>
        </div>

        <div className="flex items-end justify-between">
          <p className="text-[2.2vw] text-white/60 max-w-[54vw] leading-snug">
            Pre-Seed-Finanzierung · Markt Deutschland
          </p>
          <span className="text-[2.2vw] tracking-[0.3em] text-white/45">
            01 / 14
          </span>
        </div>
      </div>
    </div>
  );
}
