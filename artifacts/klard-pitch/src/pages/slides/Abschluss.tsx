export default function Abschluss() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-deep text-white font-display">
      <div className="absolute inset-0 blueprint-grid-dark pointer-events-none" />
      <div className="absolute -top-[8vw] right-[8vw] w-[30vw] h-[30vw] rounded-full bg-primary/20 blur-[8vw] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[28vw] h-[28vw] rounded-full bg-accent/10 blur-[7vw] pointer-events-none" />

      <div className="relative h-full px-[8vw] py-[8vh] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.9vw]">
            <div className="w-[1.3vw] h-[1.3vw] bg-accent" />
            <span className="text-[1.5vw] tracking-[0.4em] font-semibold text-white/80">
              KLARD
            </span>
          </div>
          <span className="text-[1.5vw] tracking-[0.3em] text-white/45">19 / 19</span>
        </div>

        <div className="max-w-[70vw]">
          <h2 className="text-[6.5vw] font-extrabold tracking-tighter leading-[0.95] text-balance">
            Einfach gefunden, einfach gebucht.
          </h2>
          <div className="mt-[3vh] w-[12vw] h-[0.6vh] bg-accent" />
          <p className="mt-[4vh] font-serif italic text-[2.2vw] text-white/85 max-w-[52vw] leading-snug">
            Vom Schnellcheck bis zum verbindlichen Termin – Baufachberatung auf
            einer Plattform.
          </p>
        </div>

        <div className="flex items-end justify-between">
          <span className="text-[2.4vw] font-extrabold tracking-tight text-white">Klard</span>
          <span className="text-[1.5vw] text-white/55">Der Marktplatz für Baufachberatung</span>
        </div>
      </div>
    </div>
  );
}
