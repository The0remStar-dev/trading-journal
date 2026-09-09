import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { KpiSummary } from "@/lib/calculations";
import { TrendingUp, TrendingDown, Target, Scale, Trophy, Skull, Hash } from "lucide-react";

export function KpiCards({ kpis }: { kpis: KpiSummary }) {
  const pnlPositive = kpis.totalNetPnl >= 0;

  const cards = [
    {
      title: "PnL net total",
      value: formatCurrency(kpis.totalNetPnl),
      sub: formatPercent(kpis.totalNetPnlPercentage),
      icon: pnlPositive ? TrendingUp : TrendingDown,
      tone: pnlPositive ? "win" : "loss",
    },
    {
      title: "Taux de réussite",
      value: formatPercent(kpis.winRate, 1),
      sub: `${kpis.totalTrades} trades au total`,
      icon: Target,
      tone: kpis.winRate >= 50 ? "win" : "loss",
    },
    {
      title: "Profit factor",
      value: Number.isFinite(kpis.profitFactor) ? kpis.profitFactor.toFixed(2) : "∞",
      sub: kpis.profitFactor >= 1.5 ? "Avantage solide" : "Surveiller le drawdown",
      icon: Scale,
      tone: kpis.profitFactor >= 1 ? "win" : "loss",
    },
    {
      title: "Gain moyen / perte moyenne",
      value: `${formatCurrency(kpis.avgWin)} / ${formatCurrency(-kpis.avgLoss)}`,
      sub: "par trade clôturé",
      icon: Hash,
      tone: "neutral",
    },
    {
      title: "Meilleur trade",
      value: formatCurrency(kpis.bestTrade),
      sub: "record sur un trade",
      icon: Trophy,
      tone: "win",
    },
    {
      title: "Pire trade",
      value: formatCurrency(kpis.worstTrade),
      sub: "plus forte perte",
      icon: Skull,
      tone: "loss",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <CardTitle className="text-[11px] uppercase tracking-wide">{card.title}</CardTitle>
              <card.icon
                className={cn(
                  "h-4 w-4",
                  card.tone === "win" && "text-success",
                  card.tone === "loss" && "text-danger",
                  card.tone === "neutral" && "text-accent"
                )}
              />
            </div>
            <p
              className={cn(
                "text-mono-num text-xl font-semibold",
                card.tone === "win" && "text-success",
                card.tone === "loss" && "text-danger",
                card.tone === "neutral" && "text-foreground"
              )}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
