export default function Geschaeftsmodell() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">16 / 19</span>
        </div>

        <div className="mt-[6vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            GESCHÄFTSMODELL
          </span>
          <h2 className="mt-[1.5vh] text-[4vw] font-bold tracking-tight text-deep leading-[1.05]">
            Zwei Ertragsquellen
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[6vh] grid grid-cols-2 gap-[3vw] flex-1 items-stretch">
          <div className="bg-card border border-line p-[2.8vw] flex flex-col">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">QUELLE 01</span>
            <h3 className="mt-[2vh] text-[2.4vw] font-semibold text-deep">Provision pro Buchung</h3>
            <div className="mt-[3vh] flex items-end gap-[2vw]">
              <div>
                <div className="text-[3.4vw] font-extrabold text-deep leading-none">9 %</div>
                <div className="mt-[1vh] text-[1.5vw] text-muted">Basic</div>
              </div>
              <div>
                <div className="text-[3.4vw] font-extrabold text-primary leading-none">4 %</div>
                <div className="mt-[1vh] text-[1.5vw] text-muted">Premium</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-line p-[2.8vw] flex flex-col">
            <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">QUELLE 02</span>
            <h3 className="mt-[2vh] text-[2.4vw] font-semibold text-deep">Wiederkehrende Abos</h3>
            <div className="mt-[3vh] flex items-end gap-[0.8vw]">
              <span className="text-[3.4vw] font-extrabold text-accent leading-none">89 €</span>
              <span className="text-[1.5vw] text-muted mb-[0.8vh]">/ Monat · Premium</span>
            </div>
            <p className="mt-[3vh] text-[1.5vw] leading-snug text-muted">
              Planbare, wiederkehrende Umsätze ergänzen die Vermittlungsprovision.
            </p>
          </div>
        </div>

        <p className="mt-[3vh] text-[1.5vw] text-deep font-medium">
          Zahlungsabwicklung vollständig über Stripe.
        </p>
      </div>
    </div>
  );
}
