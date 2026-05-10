import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const STORAGE_KEY = "klard.cookieConsent.v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // ignore
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  function reject() {
    try {
      localStorage.setItem(STORAGE_KEY, "rejected");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-Hinweis"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur p-4 shadow-lg"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="text-sm text-foreground flex-1">
          Wir verwenden nur technisch notwendige Cookies (z. B. für Anmeldung).
          Es findet kein Tracking statt. Mehr in unserer{" "}
          <Link href="/datenschutz" className="underline text-primary">Datenschutzerklärung</Link> und{" "}
          <Link href="/cookies" className="underline text-primary">Cookie-Richtlinie</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={reject} data-testid="button-cookie-reject">
            Nur notwendige
          </Button>
          <Button size="sm" onClick={accept} data-testid="button-cookie-accept">
            Verstanden
          </Button>
        </div>
      </div>
    </div>
  );
}
