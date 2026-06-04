export default function RechnungenZahlungen() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">12 / 19</span>
        </div>

        <div className="mt-[6vh] grid grid-cols-2 gap-[6vw] items-center flex-1">
          <div>
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
              FUNKTION
            </span>
            <h2 className="mt-[1.5vh] text-[4vw] font-bold tracking-tight text-deep leading-[1.05]">
              Rechnungen &amp; Zahlungen
            </h2>
            <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
            <p className="mt-[4vh] text-[1.85vw] leading-relaxed text-text max-w-[34vw]">
              Online-Zahlungsabwicklung über Stripe – mit transparentem
              Zahlungsstatus für jede Buchung.
            </p>
          </div>

          <div className="bg-card border border-line p-[2.6vw]">
            <div className="flex items-center justify-between border-b border-line pb-[2vh]">
              <span className="text-[1.5vw] font-semibold text-deep">Rechnung</span>
              <span className="px-[1.1vw] py-[0.6vh] bg-primary text-white text-[1.5vw] font-semibold">bezahlt</span>
            </div>
            <div className="mt-[2.5vh] flex items-center justify-between">
              <span className="text-[1.5vw] text-muted">Energieberatung vor Ort</span>
              <span className="text-[1.7vw] font-semibold text-deep">1.450,00 €</span>
            </div>
            <div className="mt-[1.5vh] flex items-center justify-between">
              <span className="text-[1.5vw] text-muted">zzgl. 19 % USt.</span>
              <span className="text-[1.5vw] text-deep">275,50 €</span>
            </div>
            <div className="mt-[3vh] border-t border-line pt-[2.5vh]">
              <span className="text-[1.5vw] text-primary font-semibold">§ 14 UStG-konforme Rechnung</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
