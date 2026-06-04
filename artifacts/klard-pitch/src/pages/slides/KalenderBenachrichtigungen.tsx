export default function KalenderBenachrichtigungen() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">13 / 19</span>
        </div>

        <div className="mt-[6vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            FUNKTION
          </span>
          <h2 className="mt-[1.5vh] text-[4vw] font-bold tracking-tight text-deep leading-[1.05]">
            Kalender &amp; Benachrichtigungen
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[6vh] grid grid-cols-2 gap-[3vw] flex-1 items-stretch">
          <div className="bg-card border border-line p-[2.6vw] flex flex-col">
            <h3 className="text-[2.2vw] font-semibold text-deep">Kalender-Sync</h3>
            <p className="mt-[2.5vh] text-[1.6vw] leading-snug text-muted">
              Abonnierbarer iCal-Feed für Berater – alle Termine automatisch im
              eigenen Kalender.
            </p>
            <p className="mt-[2vh] text-[1.6vw] leading-snug text-muted">
              Termin-Download für Kunden direkt nach der Buchung.
            </p>
          </div>
          <div className="bg-deep p-[2.6vw] flex flex-col">
            <h3 className="text-[2.2vw] font-semibold text-white">Automatische E-Mails</h3>
            <div className="mt-[2.5vh] flex items-center gap-[1vw]">
              <div className="w-[0.6vw] h-[0.6vw] bg-accent" />
              <span className="text-[1.6vw] text-white/85">Buchungsbestätigung</span>
            </div>
            <div className="mt-[1.6vh] flex items-center gap-[1vw]">
              <div className="w-[0.6vw] h-[0.6vw] bg-accent" />
              <span className="text-[1.6vw] text-white/85">24-Stunden-Erinnerung</span>
            </div>
            <div className="mt-[1.6vh] flex items-center gap-[1vw]">
              <div className="w-[0.6vw] h-[0.6vw] bg-accent" />
              <span className="text-[1.6vw] text-white/85">Stornierung</span>
            </div>
            <div className="mt-[1.6vh] flex items-center gap-[1vw]">
              <div className="w-[0.6vw] h-[0.6vw] bg-accent" />
              <span className="text-[1.6vw] text-white/85">Zahlungsbestätigung</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
