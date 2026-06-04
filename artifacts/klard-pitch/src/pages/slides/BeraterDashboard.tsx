export default function BeraterDashboard() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">14 / 19</span>
        </div>

        <div className="mt-[5vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            FÜR BERATER
          </span>
          <h2 className="mt-[1.5vh] text-[4vw] font-bold tracking-tight text-deep leading-[1.05]">
            Das Berater-Dashboard
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[6vh] grid grid-cols-4 gap-[1.6vw] flex-1">
          <div className="bg-card border border-line p-[1.8vw] flex flex-col justify-between">
            <span className="text-[1.6vw] font-semibold text-deep">Profil</span>
            <span className="text-[1.5vw] text-muted leading-snug">Name, Bio, Standort, Kontakt.</span>
          </div>
          <div className="bg-card border border-line p-[1.8vw] flex flex-col justify-between">
            <span className="text-[1.6vw] font-semibold text-deep">Leistungen</span>
            <span className="text-[1.5vw] text-muted leading-snug">Anlegen, bearbeiten, Preise pflegen.</span>
          </div>
          <div className="bg-card border border-line p-[1.8vw] flex flex-col justify-between">
            <span className="text-[1.6vw] font-semibold text-deep">Verfügbarkeiten</span>
            <span className="text-[1.5vw] text-muted leading-snug">Freie Slots im Kalender steuern.</span>
          </div>
          <div className="bg-card border border-line p-[1.8vw] flex flex-col justify-between">
            <span className="text-[1.6vw] font-semibold text-deep">Buchungen</span>
            <span className="text-[1.5vw] text-muted leading-snug">Anfragen annehmen und verwalten.</span>
          </div>
        </div>

        <div className="mt-[2.5vh] flex items-center justify-between bg-deep px-[3vw] py-[2.6vh]">
          <span className="text-[1.6vw] font-semibold text-white">Statistiken zu Umsatz und Terminen</span>
          <span className="text-[1.6vw] font-semibold text-accent">Premium-Funktionen &amp; Upsell</span>
        </div>
      </div>
    </div>
  );
}
