export default function GebaeudecheckVollanalyse() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">11 / 19</span>
        </div>

        <div className="mt-[5vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            GEBÄUDECHECK · TEIL 2
          </span>
          <h2 className="mt-[1.5vh] text-[4vw] font-bold tracking-tight text-deep leading-[1.05]">
            Die Vollanalyse
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[5vh] grid grid-cols-3 gap-[2vw]">
          <div className="bg-card border border-line p-[2vw]">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">PERSPEKTIVE 01</span>
            <h3 className="mt-[1.5vh] text-[2vw] font-semibold text-deep">Wert</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-muted">Marktwert und Wertentwicklung des Gebäudes.</p>
          </div>
          <div className="bg-card border border-line p-[2vw]">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">PERSPEKTIVE 02</span>
            <h3 className="mt-[1.5vh] text-[2vw] font-semibold text-deep">Risiko</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-muted">Sanierungs- und Kostenrisiken im Überblick.</p>
          </div>
          <div className="bg-card border border-line p-[2vw]">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">PERSPEKTIVE 03</span>
            <h3 className="mt-[1.5vh] text-[2vw] font-semibold text-deep">Energie</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-muted">Energieklasse, Verbrauch und Einsparpotenzial.</p>
          </div>
        </div>

        <div className="mt-[3vh] flex items-center justify-between bg-deep px-[3vw] py-[3vh]">
          <span className="text-[1.7vw] font-semibold text-white">Förderprogramme BAFA &amp; KfW</span>
          <span className="text-[1.5vw] text-white/40">·</span>
          <span className="text-[1.7vw] font-semibold text-white">Solarpotenzial-Einschätzung</span>
          <span className="text-[1.5vw] text-white/40">·</span>
          <span className="text-[1.7vw] font-semibold text-accent">Speicherbar &amp; als Premium-Tool</span>
        </div>
        <p className="mt-[2vh] text-[1.5vw] text-muted">Alle Angaben sind eine unverbindliche Schätzung.</p>
      </div>
    </div>
  );
}
