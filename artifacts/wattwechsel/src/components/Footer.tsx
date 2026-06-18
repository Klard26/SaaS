import { Link } from "wouter";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[var(--klard-ink)] text-white/45 mt-16 px-4 sm:px-8 pt-14 pb-8">
      <div className="max-w-[1100px] mx-auto grid gap-9 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] mb-9">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--klard-green)]">
              <Zap className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <span className="klard-logo text-[1.3rem] text-white">
              ener<span className="text-[var(--klard-green)]">watt24</span>
            </span>
          </div>
          <p className="text-[0.78rem] leading-[1.7] max-w-[280px]">
            Die neutrale Energiewechsel-Plattform für die Wohnungswirtschaft.
            Analysieren, freigeben, wechseln – rechtssicher und lückenlos protokolliert.
          </p>
        </div>

        <div>
          <h4 className="text-white/70 text-[0.74rem] font-bold tracking-wider uppercase mb-3">Plattform</h4>
          <Link href="/" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Start</Link>
          <Link href="/portfolio" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Cockpit</Link>
          <Link href="/onboarding" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Registrierung</Link>
        </div>

        <div>
          <h4 className="text-white/70 text-[0.74rem] font-bold tracking-wider uppercase mb-3">Für wen</h4>
          <p className="text-[0.78rem] text-white/35 mb-2">Hausverwalter</p>
          <p className="text-[0.78rem] text-white/35 mb-2">Bestandshalter</p>
          <p className="text-[0.78rem] text-white/35 mb-2">WEG-Verwaltung</p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto border-t border-white/10 pt-6 text-center text-[0.7rem]">
        © {new Date().getFullYear()} enerwatt24 · Neutrale Energiewechsel-Plattform
      </div>
    </footer>
  );
}
