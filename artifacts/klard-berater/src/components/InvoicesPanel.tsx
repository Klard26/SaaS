import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyInvoiceSettings,
  getGetMyInvoiceSettingsQueryKey,
  useUpdateMyInvoiceSettings,
  useListMyProviderInvoices,
  getListMyProviderInvoicesQueryKey,
  getGetInvoicePdfUrl,
  type InvoiceSettings,
  type InvoiceSettingsUpdate,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Save } from "lucide-react";

function eur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function InvoicesPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useGetMyInvoiceSettings({
    query: { queryKey: getGetMyInvoiceSettingsQueryKey() },
  });
  const { data: invoices = [], isLoading: invoicesLoading } = useListMyProviderInvoices({
    query: { queryKey: getListMyProviderInvoicesQueryKey() },
  });
  const update = useUpdateMyInvoiceSettings();

  const [form, setForm] = useState<InvoiceSettingsUpdate>({});

  useEffect(() => {
    if (settings) {
      setForm({
        kleinunternehmer: settings.kleinunternehmer,
        vatRate: settings.vatRate,
        invoicePrefix: settings.invoicePrefix ?? "",
        iban: settings.iban ?? "",
        invoiceFooter: settings.invoiceFooter ?? "",
        autoIssueInvoices: settings.autoIssueInvoices,
        companyLegalName: settings.companyLegalName ?? "",
        taxId: settings.taxId ?? "",
        address: settings.address ?? "",
      });
    }
  }, [settings]);

  async function handleSave() {
    try {
      const payload: InvoiceSettingsUpdate = {
        ...form,
        invoicePrefix: form.invoicePrefix || null,
        iban: form.iban || null,
        invoiceFooter: form.invoiceFooter || null,
        companyLegalName: form.companyLegalName || null,
        taxId: form.taxId || null,
        address: form.address || null,
      };
      await update.mutateAsync({ data: payload });
      qc.invalidateQueries({ queryKey: getGetMyInvoiceSettingsQueryKey() });
      toast({ title: "Rechnungseinstellungen gespeichert" });
    } catch (e) {
      toast({
        title: "Speichern fehlgeschlagen",
        description: e instanceof Error ? e.message : "Bitte später erneut versuchen.",
        variant: "destructive",
      });
    }
  }

  const completeness = settings ? computeCompleteness(settings) : null;

  return (
    <div className="space-y-6">
      <Card className="rounded-[20px] border-[1.5px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="font-serif text-lg font-semibold">Rechnungseinstellungen</CardTitle>
            {completeness && !completeness.ok && (
              <Badge variant="outline" className="text-xs" data-testid="badge-invoice-incomplete">
                Stammdaten unvollständig
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-5">
              {completeness && !completeness.ok && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3" data-testid="text-invoice-warning">
                  Für § 14 UStG-konforme Rechnungen fehlen noch: {completeness.missing.join(", ")}.
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Firmen-/Rechnungsname" testid="input-invoice-company">
                  <Input
                    value={form.companyLegalName ?? ""}
                    onChange={(e) => setForm({ ...form, companyLegalName: e.target.value })}
                    placeholder="Max Mustermann e.K."
                    data-testid="input-invoice-company"
                  />
                </Field>
                <Field label="Steuernummer oder USt-IdNr." testid="input-invoice-taxid">
                  <Input
                    value={form.taxId ?? ""}
                    onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    placeholder="DE123456789"
                    data-testid="input-invoice-taxid"
                  />
                </Field>
                <Field label="Adresse (Straße + Hausnummer)" testid="input-invoice-address">
                  <Input
                    value={form.address ?? ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Musterstraße 1"
                    data-testid="input-invoice-address"
                  />
                </Field>
                <Field label="IBAN (optional)" testid="input-invoice-iban">
                  <Input
                    value={form.iban ?? ""}
                    onChange={(e) => setForm({ ...form, iban: e.target.value })}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    data-testid="input-invoice-iban"
                  />
                </Field>
                <Field label="Rechnungsnummer-Präfix" testid="input-invoice-prefix">
                  <Input
                    value={form.invoicePrefix ?? ""}
                    onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                    placeholder="RE"
                    maxLength={8}
                    data-testid="input-invoice-prefix"
                  />
                </Field>
                <Field label="MwSt-Satz (%)" testid="input-invoice-vatrate">
                  <Input
                    value={form.vatRate ?? ""}
                    onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                    placeholder="19.00"
                    disabled={!!form.kleinunternehmer}
                    data-testid="input-invoice-vatrate"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-semibold">Kleinunternehmer (§ 19 UStG)</div>
                  <p className="text-xs text-muted-foreground mt-0.5">Keine MwSt auf Rechnungen ausweisen.</p>
                </div>
                <Switch
                  checked={!!form.kleinunternehmer}
                  onCheckedChange={(v) => setForm({ ...form, kleinunternehmer: v })}
                  data-testid="switch-kleinunternehmer"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-semibold">Rechnungen automatisch ausstellen</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sobald ein Kunde online bezahlt, wird automatisch eine PDF-Rechnung erzeugt und per E-Mail verschickt.
                  </p>
                </div>
                <Switch
                  checked={!!form.autoIssueInvoices}
                  onCheckedChange={(v) => setForm({ ...form, autoIssueInvoices: v })}
                  data-testid="switch-auto-invoices"
                />
              </div>

              <Field label="Fußzeile auf Rechnungen (optional)" testid="textarea-invoice-footer">
                <Textarea
                  value={form.invoiceFooter ?? ""}
                  onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
                  placeholder="z. B. Geschäftsführer · Handelsregister · Bankverbindung"
                  rows={2}
                  data-testid="textarea-invoice-footer"
                />
              </Field>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={update.isPending} className="gap-1.5 rounded-full" data-testid="button-save-invoice-settings">
                  <Save className="h-4 w-4" />
                  {update.isPending ? "Wird gespeichert…" : "Speichern"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-[1.5px]">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg font-semibold">Ausgestellte Rechnungen</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {invoicesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Noch keine Rechnungen ausgestellt. Rechnungen werden automatisch erzeugt, sobald ein Kunde online bezahlt.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Nummer</th>
                    <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Datum</th>
                    <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Kunde</th>
                    <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Leistung</th>
                    <th className="text-right font-medium text-muted-foreground pb-3 pr-4">Betrag</th>
                    <th className="text-left font-medium text-muted-foreground pb-3">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {inv.invoiceNumber}
                        {inv.kind === "storno" && (
                          <Badge variant="destructive" className="ml-2 text-[10px]">Storno</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(inv.issuedAt).toLocaleDateString("de-DE")}
                      </td>
                      <td className="py-3 pr-4">{inv.customerName ?? "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{inv.serviceName}</td>
                      <td className="py-3 pr-4 text-right font-medium">
                        {inv.kind === "storno" ? "−" : ""}{eur(inv.totalCents)}
                      </td>
                      <td className="py-3">
                        {inv.hasPdf ? (
                          <a
                            href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api${getGetInvoicePdfUrl(inv.id)}`}
                            target="_blank"
                            rel="noreferrer"
                            data-testid={`link-invoice-pdf-${inv.id}`}
                          >
                            <Button size="sm" variant="outline" className="h-7 gap-1 rounded-full border-[1.5px]">
                              <Download className="h-3.5 w-3.5" /> PDF
                            </Button>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" /> wird erstellt…
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, testid }: { label: string; children: React.ReactNode; testid: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={testid} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}

function computeCompleteness(s: InvoiceSettings): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!s.companyLegalName) missing.push("Firmen-/Rechnungsname");
  if (!s.taxId) missing.push("Steuernummer/USt-IdNr.");
  if (!s.address) missing.push("Adresse");
  return { ok: missing.length === 0, missing };
}
