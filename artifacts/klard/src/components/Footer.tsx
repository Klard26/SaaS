import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[var(--klard-ink)] text-white/45 mt-16 px-4 sm:px-8 pt-14 pb-8">
      <div className="max-w-[1100px] mx-auto grid gap-9 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] mb-9">
        <div>
          <div className="klard-logo text-[1.4rem] text-white mb-2">
            klar<span className="text-[rgba(8,145,178,0.85)]">d</span>
          </div>
          <p className="text-[0.78rem] leading-[1.7] max-w-[280px]">
            Klare Preise. Geprüfte Berater. Direkt buchbar. Die erste transparente Plattform
            für alle Beratungsdienstleistungen in Deutschland.
          </p>
        </div>

        <div>
          <h4 className="text-white/70 text-[0.74rem] font-bold tracking-wider uppercase mb-3">Für Kunden</h4>
          <Link href="/search" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Berater finden</Link>
          <a href="/foerderschiene/" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2" data-testid="footer-gebaeudecheck">Gebäudecheck (kostenlos)</a>
          <Link href="/search" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Preisvergleich</Link>
          <Link href="/search" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">KI-Angebot</Link>
          <Link href="/search" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Bewertungen</Link>
        </div>

        <div>
          <h4 className="text-white/70 text-[0.74rem] font-bold tracking-wider uppercase mb-3">Für Anbieter</h4>
          <a href="/berater/" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Klard für Berater</a>
          <a href="/berater/pricing" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Premium-Profil</a>
        </div>

        <div>
          <h4 className="text-white/70 text-[0.74rem] font-bold tracking-wider uppercase mb-3">Rechtliches</h4>
          <Link href="/datenschutz" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Datenschutz</Link>
          <Link href="/agb" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">AGB</Link>
          <Link href="/impressum" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Impressum</Link>
          <Link href="/cookies" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Cookies</Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto border-t border-white/10 pt-6 text-center text-[0.7rem]">
        © {new Date().getFullYear()} Klard · klard.de · Alle Preise inkl. MwSt. · Geprüfte Anbieter
      </div>
    </footer>
  );
}
