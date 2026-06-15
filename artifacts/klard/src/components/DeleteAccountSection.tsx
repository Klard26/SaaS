import { useState } from "react";
import { useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { useDeleteMyAccount } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

const CONFIRM_WORD = "LÖSCHEN";

/**
 * Standard "Danger Zone" account-deletion card. Permanently removes the user's
 * entire account (provider + customer data + login) after an explicit
 * type-to-confirm step, then signs the user out and returns them to the start.
 */
export function DeleteAccountSection({
  variant = "Konto",
}: {
  variant?: "Berater-Konto" | "Kundenkonto" | "Konto";
}) {
  const [, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const qc = useQueryClient();
  const deleteAccount = useDeleteMyAccount();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync();
      qc.clear();
      toast({
        title: "Konto gelöscht",
        description: "Ihr Konto und alle zugehörigen Daten wurden entfernt.",
      });
      await signOut({ redirectUrl: basePath || "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Konto konnte nicht gelöscht werden.";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          {variant} löschen
        </CardTitle>
        <CardDescription>
          Wenn Sie Ihr Konto löschen, werden Ihr Profil, alle Buchungen, Bewertungen und
          zugehörigen Daten unwiderruflich entfernt. Dieser Vorgang kann nicht rückgängig
          gemacht werden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => {
            setConfirmText("");
            setOpen(true);
          }}
          data-testid="button-open-delete-account"
        >
          Konto löschen
        </Button>
      </CardContent>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konto endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Damit werden Ihr Berater- und Kundenkonto, alle Buchungen, Bewertungen sowie
              Ihr Zugang dauerhaft gelöscht. Eine laufende Premium-Mitgliedschaft wird
              gekündigt. Geben Sie zur Bestätigung <strong>{CONFIRM_WORD}</strong> ein.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-delete">Bestätigung</Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              data-testid="input-confirm-delete"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Abbrechen</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={confirmText.trim() !== CONFIRM_WORD || deleteAccount.isPending}
              onClick={handleDelete}
              data-testid="button-confirm-delete"
            >
              {deleteAccount.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Wird gelöscht...
                </>
              ) : (
                "Endgültig löschen"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
