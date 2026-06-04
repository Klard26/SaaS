export default function TechnologieSicherheit() {
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
          <span className="text-[1.5vw] tracking-[0.3em] text-muted">18 / 19</span>
        </div>

        <div className="mt-[5vh]">
          <span className="text-[1.5vw] tracking-[0.2em] text-primary font-semibold">
            FUNDAMENT
          </span>
          <h2 className="mt-[1.5vh] text-[4vw] font-bold tracking-tight text-deep leading-[1.05]">
            Technologie &amp; Sicherheit
          </h2>
          <div className="mt-[2.5vh] w-[8vw] h-[0.5vh] bg-primary" />
        </div>

        <div className="mt-[5vh] grid grid-cols-2 gap-[3vw]">
          <div className="bg-card border border-line p-[2.4vw]">
            <h3 className="text-[1.8vw] font-semibold text-deep">Architektur</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-muted">
              React, Express und PostgreSQL – moderne, skalierbare Grundlage.
            </p>
          </div>
          <div className="bg-card border border-line p-[2.4vw]">
            <h3 className="text-[1.8vw] font-semibold text-deep">Dienste</h3>
            <p className="mt-[1.5vh] text-[1.5vw] leading-snug text-muted">
              Clerk für Login, Stripe für Zahlungen, Resend für E-Mails,
              Anthropic für KI.
            </p>
          </div>
        </div>

        <div className="mt-[3vh] flex items-center gap-[1.4vw]">
          <span className="px-[1.8vw] py-[1.2vh] bg-deep text-white text-[1.5vw] font-semibold">DSGVO-konform</span>
          <span className="px-[1.8vw] py-[1.2vh] border border-line bg-card text-deep text-[1.5vw] font-semibold">HOAI</span>
          <span className="px-[1.8vw] py-[1.2vh] border border-line bg-card text-deep text-[1.5vw] font-semibold">BAFA</span>
          <span className="px-[1.8vw] py-[1.2vh] border border-line bg-card text-deep text-[1.5vw] font-semibold">KfW</span>
        </div>
      </div>
    </div>
  );
}
