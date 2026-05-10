import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 prose prose-sm prose-neutral flex-1">
        <h1 className="text-2xl font-bold text-foreground">Cookie-Richtlinie</h1>
        <p className="text-muted-foreground">Stand: {new Date().toLocaleDateString("de-DE")}</p>

        <p>Klard verwendet ausschließlich technisch notwendige Cookies, um die Plattform zu betreiben.</p>

        <h2 className="text-lg font-semibold mt-6">Verwendete Cookies</h2>
        <table className="text-sm w-full border border-border">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Zweck</th>
              <th className="p-2 text-left">Anbieter</th>
              <th className="p-2 text-left">Speicherdauer</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2">__session</td>
              <td className="p-2">Anmeldung &amp; Sitzungsverwaltung</td>
              <td className="p-2">Clerk</td>
              <td className="p-2">Sitzungsende</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">klard.cookieConsent.v1</td>
              <td className="p-2">Speichert Einwilligung zum Cookie-Hinweis</td>
              <td className="p-2">Klard (LocalStorage)</td>
              <td className="p-2">12 Monate</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">__stripe_mid / __stripe_sid</td>
              <td className="p-2">Betrugsprävention bei Zahlungen</td>
              <td className="p-2">Stripe</td>
              <td className="p-2">1 Jahr / 30 Min.</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-4">
          Es werden keine Tracking- oder Marketing-Cookies eingesetzt. Es findet kein Profiling statt.
        </p>
      </main>
      <Footer />
    </div>
  );
}
