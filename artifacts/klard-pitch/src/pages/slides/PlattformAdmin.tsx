export default function PlattformAdmin() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">17 / 19</span>
        </div>

        <div className="mt-[5vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            STEUERUNG
          </span>
          <h2 className="mt-[1.5vh] text-[4vw] font-bold tracking-tight text-deep leading-[1.05]">
            Plattform-Administration
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[6vh] grid grid-cols-5 gap-[1.4vw] flex-1">
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-end">
            <span className="text-[1.7vw] font-semibold text-deep leading-tight">Umsätze</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-end">
            <span className="text-[1.7vw] font-semibold text-deep leading-tight">Buchungen</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-end">
            <span className="text-[1.7vw] font-semibold text-deep leading-tight">Anbieter</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-end">
            <span className="text-[1.7vw] font-semibold text-deep leading-tight">Kunden</span>
          </div>
          <div className="bg-card border border-line p-[1.6vw] flex flex-col justify-end">
            <span className="text-[1.7vw] font-semibold text-deep leading-tight">Kategorien</span>
          </div>
        </div>

        <p className="mt-[3vh] text-[1.7vw] text-deep font-medium max-w-[60vw]">
          Tagesgenaue Auswertungen für Steuerung und Wachstum – alles in einem
          zentralen Dashboard.
        </p>
      </div>
    </div>
  );
}
