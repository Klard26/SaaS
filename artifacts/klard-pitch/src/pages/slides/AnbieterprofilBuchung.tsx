export default function AnbieterprofilBuchung() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">08 / 19</span>
        </div>

        <div className="mt-[6vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            FUNKTION
          </span>
          <h2 className="mt-[1.5vh] text-[4.2vw] font-bold tracking-tight text-deep leading-[1.05]">
            Anbieterprofil &amp; Buchung
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[6vh] grid grid-cols-3 gap-[2.4vw] flex-1 items-stretch">
          <div className="bg-card border border-line p-[2.2vw] flex flex-col">
            <h3 className="text-[2vw] font-semibold text-deep">Profil</h3>
            <p className="mt-[2vh] text-[1.5vw] leading-snug text-muted">
              Bio, Standort und vollständige Leistungsliste mit Preisen.
            </p>
          </div>
          <div className="bg-card border border-line p-[2.2vw] flex flex-col">
            <h3 className="text-[2vw] font-semibold text-deep">Live-Termine</h3>
            <p className="mt-[2vh] text-[1.5vw] leading-snug text-muted">
              Auswahl aus echten freien Slots – sofort und verbindlich.
            </p>
          </div>
          <div className="bg-card border border-line p-[2.2vw] flex flex-col">
            <h3 className="text-[2vw] font-semibold text-deep">Bewertungen</h3>
            <p className="mt-[2vh] text-[1.5vw] leading-snug text-muted">
              Echte Kundenbewertungen schaffen Vertrauen vor der Buchung.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
