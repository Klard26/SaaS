import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Klard – Berater buchen</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
            <Link href="/agb" className="hover:text-foreground">AGB</Link>
            <Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
            <Link href="/pricing" className="hover:text-foreground">Für Berater</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
