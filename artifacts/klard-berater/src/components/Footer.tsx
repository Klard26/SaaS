import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[var(--klard-ink)] text-white/45 mt-16 px-4 sm:px-8 pt-14 pb-8">
      <div className="max-w-[1100px] mx-auto grid gap-9 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] mb-9">
        <div>
          <div className="klard-logo text-[1.4rem] text-white mb-2">
            klar<span className="text-[rgba(8,145,178,0.85)]">d</span>
            <span className="text-white/40 text-[0.9rem] font-normal ml-1">für Berater</span>
          </div>
          <p className="text-[0.78rem] leading-[1.7] max-w-[280px]">
            Gewinnen Sie planbar neue Mandanten. Profil, Leistungen, Verfügbarkeit und
            Buchungen — alles an einem Ort. Geprüft, transparent, direkt buchbar.
          </p>
        </div>

        <div>
          <h4 className="text-white/70 text-[0.74rem] font-bold tracking-wider uppercase mb-3">Für Berater</h4>
          <Link href="/provider/onboarding" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Profil erstellen</Link>
          <Link href="/provider/services" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Leistungen pflegen</Link>
          <Link href="/dashboard" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Dashboard</Link>
          <Link href="/pricing" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Premium-Profil</Link>
          <a href="/" className="block text-[0.78rem] text-white/35 hover:text-white/70 mb-2">Zu Klard für Kunden</a>
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
        © {new Date().getFullYear()} Klard · klard.de · Plattform für geprüfte Berater
      </div>
    </footer>
  );
}
