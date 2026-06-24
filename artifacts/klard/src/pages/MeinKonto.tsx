import { useUser } from "@clerk/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { GuidedHeader } from "@/components/journey/GuidedHeader";
import { User } from "lucide-react";

/**
 * Uniform customer account page. Identical for every Klard customer — there is
 * no account-type / commercial branching here (the commercial Immobilien
 * experience now lives in the standalone Förderschiene app). Surfaces the login
 * identity and the DSGVO account-deletion control.
 */
export default function MeinKonto() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <GuidedHeader
          icon={User}
          title="Mein Konto"
          subtitle="Verwalten Sie Ihre Kontodaten."
        />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Ihre Daten</CardTitle>
            <CardDescription>Diese Angaben stammen aus Ihrem Login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name: </span>
              {user?.fullName ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">E-Mail: </span>
              {user?.primaryEmailAddress?.emailAddress ?? "—"}
            </p>
          </CardContent>
        </Card>

        <div className="mt-8">
          <DeleteAccountSection variant="Konto" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
