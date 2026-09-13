import { NotebookText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, DirectionBadge } from "@/components/trades/StatusBadge";
import { formatDate, cn } from "@/lib/utils";
import type { Trade } from "@/types/trade";

export function RecentTradesTable({ trades }: { trades: Trade[] }) {
  const recent = [...trades]
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Derniers trades</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {recent.length === 0 ? (
          <EmptyState icon={NotebookText} title="Aucun trade loggé" description="Commence à logger tes trades dans le Journal." />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Instrument</th>
                <th className="pb-2 font-medium">Setup</th>
                <th className="pb-2 font-medium">Direction</th>
                <th className="pb-2 font-medium">R</th>
                <th className="pb-2 text-right font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 text-foreground">{formatDate(t.entryDate)}</td>
                  <td className="py-2 font-medium text-foreground">{t.symbol}</td>
                  <td className="py-2 text-muted">{t.tags[0] ?? "—"}</td>
                  <td className="py-2">
                    <DirectionBadge direction={t.direction} />
                  </td>
                  <td
                    className={cn(
                      "py-2 font-medium",
                      t.rMultiple === null ? "text-muted" : t.rMultiple >= 0 ? "text-win" : "text-loss"
                    )}
                  >
                    {t.rMultiple !== null ? `${t.rMultiple >= 0 ? "+" : ""}${t.rMultiple.toFixed(2)}R` : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}