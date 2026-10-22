import { Lock, NotebookText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, DirectionBadge } from "@/components/trades/StatusBadge";
import { formatDate, cn } from "@/lib/utils";
import type { PublicTradeRow } from "@/types/publicProfile";

export function ProfileTradesTable({ trades }: { trades: PublicTradeRow[] | null }) {
  if (trades === null) {
    return (
      <Card>
        <CardContent className="p-4">
          <EmptyState icon={Lock} title="Trades non partagés par ce trader" className="py-8" />
        </CardContent>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <EmptyState icon={NotebookText} title="Aucun trade clôturé à afficher" className="py-8" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-4">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Instrument</th>
              <th className="pb-2 font-medium">Direction</th>
              <th className="pb-2 font-medium">Setup</th>
              <th className="pb-2 font-medium">R</th>
              <th className="pb-2 text-right font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2 text-foreground">{formatDate(t.entryDate)}</td>
                <td className="py-2 font-medium text-foreground">{t.symbol}</td>
                <td className="py-2">
                  <DirectionBadge direction={t.direction} />
                </td>
                <td className="py-2 text-muted">{t.tags[0] ?? "—"}</td>
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
      </CardContent>
    </Card>
  );
}
