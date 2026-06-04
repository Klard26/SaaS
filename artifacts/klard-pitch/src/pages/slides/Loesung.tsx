export default function Loesung() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-display">
      <div className="absolute inset-0 blueprint-grid pointer-events-none" />
      <div className="absolute top-0 right-0 h-full w-[34vw] bg-tealsoft pointer-events-none" />

      <div className="relative h-full px-[8vw] py-[7vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.8vw]">
            <div className="w-[1.1vw] h-[1.1vw] bg-primary" />
            <span className="text-[1.5vw] tracking-[0.4em] text-muted font-semibold">
              KLARD
            </span>
          </div>
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">03 / 19</span>
        </div>

        <div className="mt-[10vh] grid grid-cols-2 gap-[6vw] items-center flex-1">
          <div>
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
              DIE LÖSUNG
            </span>
            <h2 className="mt-[2vh] text-[4.4vw] font-bold tracking-tight text-deep leading-[1.05] text-balance">
              Alle Berater. Eine Plattform.
            </h2>
            <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
            <p className="mt-[4vh] text-[1.9vw] leading-relaxed text-text max-w-[34vw]">
              Klard bündelt qualifizierte Baufachberater an einem Ort. Suchen,
              vergleichen und in Minuten verbindlich buchen.
            </p>
          </div>
          <div className="relative">
            <p className="font-serif italic text-[2.6vw] leading-[1.35] text-deep">
              „Online, transparent und ohne Umwege – vom ersten Klick bis zum
              verbindlichen Termin.“
            </p>
            <div className="mt-[4vh] flex items-center gap-[1.4vw]">
              <div className="px-[1.6vw] py-[1vh] bg-deep text-white text-[1.5vw] font-semibold tracking-wide">
                Transparent
              </div>
              <div className="px-[1.6vw] py-[1vh] bg-primary text-white text-[1.5vw] font-semibold tracking-wide">
                Schnell
              </div>
              <div className="px-[1.6vw] py-[1vh] border border-line bg-card text-deep text-[1.5vw] font-semibold tracking-wide">
                Verbindlich
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
