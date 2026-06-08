import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useListTarife, getListTarifeQueryKey } from "@workspace/api-client-react";
import { SPARTEN, SPARTE_LABELS, type Sparte } from "@workspace/energie-wechsel";

export function TarifeTab() {
  const [sparte, setSparte] = useState<Sparte | "alle">("alle");

  const params = sparte === "alle" ? undefined : { sparte };
  const { data: tarife = [], isLoading } = useListTarife(params, {
    query: { queryKey: getListTarifeQueryKey(params) },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground flex-1 min-w-[200px]">
          Transparenter Marktüberblick. In der Demo durch einen repräsentativen Tarif-Feed abgebildet.
        </p>
        <Select value={sparte} onValueChange={(v) => setSparte(v as Sparte | "alle")}>
          <SelectTrigger className="w-[180px]" data-testid="select-tarif-sparte">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Sparten</SelectItem>
            {SPARTEN.map((s) => (
              <SelectItem key={s} value={s}>{SPARTE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tarife.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Keine Tarife gefunden.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Versorger</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Sparte</TableHead>
                  <TableHead className="text-right">Arbeitspreis</TableHead>
                  <TableHead className="text-right">Grundpreis/Jahr</TableHead>
                  <TableHead>Laufzeit</TableHead>
                  <TableHead>Öko</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarife.map((t) => (
                  <TableRow key={t.id} data-testid={`tarif-${t.id}`}>
                    <TableCell className="font-medium">{t.versorger}</TableCell>
                    <TableCell>{t.tarifname}</TableCell>
                    <TableCell>{SPARTE_LABELS[t.sparte as Sparte] ?? t.sparte}</TableCell>
                    <TableCell className="text-right">{t.arbeitspreisCtKwh.toFixed(2)} ct/kWh</TableCell>
                    <TableCell className="text-right">{t.grundpreisEurJahr.toFixed(0)} €</TableCell>
                    <TableCell>{t.laufzeitMonate ? `${t.laufzeitMonate} Mon.` : "—"}</TableCell>
                    <TableCell>
                      {t.oekostrom && (
                        <Badge variant="outline" className="border-[var(--klard-green)] text-[var(--klard-green)]">
                          Öko
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
