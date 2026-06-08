import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useListAuditLog, getListAuditLogQueryKey } from "@workspace/api-client-react";

function fmt(ts: string): string {
  return new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditTab() {
  const { data: entries = [], isLoading } = useListAuditLog({
    query: { queryKey: getListAuditLogQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Noch keine Audit-Einträge. Aktivitäten wie Analysen, Freigaben und Widersprüche werden hier protokolliert.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {entries.map((e) => (
            <li key={e.id} className="px-5 py-3.5 flex items-start gap-4" data-testid={`audit-${e.id}`}>
              <div className="w-2 h-2 rounded-full bg-[var(--klard-green)] mt-1.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{e.aktion}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {e.akteur} · {fmt(e.zeitpunkt)}
                </p>
                {e.details && Object.keys(e.details).length > 0 && (
                  <pre className="mt-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto">
                    {JSON.stringify(e.details, null, 2)}
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
