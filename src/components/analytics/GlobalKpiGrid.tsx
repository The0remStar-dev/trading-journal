import { TrendingUp, TrendingDown, Target, Scale, Activity, Shield, RotateCw, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { GlobalPerformance } from "@/types/analytics";

export function GlobalKpiGrid({ global }: { global: GlobalPerformance }) {
  const positive = global.totalR >= 0;

  const cards = [
    { title: "Total R", value: `${global.totalR >= 0 ? "+" : ""}${global.totalR}R`, icon: positive ? TrendingUp : TrendingDown, tone: positive ? "win" : "loss" },
    { title: "R Moyen", value: `${global.avgR >= 0 ? "+" : ""}${global.avgR}R`, icon: Activity, tone: global.avgR >= 0 ? "win" : "loss" },
    { title: "Win Rate", value: `${global.winRate}%`, sub: `${global.closedTrades} trades clôturés`, icon: Target, tone: global.winRate >= 50 ? "win" : "loss" },
    { title: "Profit Factor", value: Number.isFinite(global.profitFactor) ? global.profitFactor.toFixed(2) : "∞", icon: Scale, tone: global.profitFactor >= 1 ? "win" : "loss" },
    { title: "Expectancy", value: `${global.expectancyR >= 0 ? "+" : ""}${global.expectancyR}R`, sub: "par trade", icon: Activity, tone: global.expectancyR >= 0 ? "win" : "loss" },
    { title: "Max Drawdown", value: `${global.maxDrawdownR}R`, icon: Shield, tone: "neutral" },
    { title: "Recovery Factor", value: global.recoveryFactor !== null ? global.recoveryFactor.toFixed(2) : "—", icon: RotateCw, tone: "neutral" },
    { title: "Avg Win", value: `+${global.avgWinR}R`, icon: ThumbsUp, tone: "win" },
    { title: "Avg Loss", value: `-${global.avgLossR}R`, icon: ThumbsDown, tone: "loss" },
    { title: "Trades Gagnants", value: String(global.winningTrades), icon: ThumbsUp, tone: "win" },
    { title: "Trades Perdants", value: String(global.losingTrades), icon: ThumbsDown, tone: "loss" },
    { title: "Breakeven", value: String(global.breakevenTrades), icon: Minus, tone: "neutral" },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <StatCard key={card.title} label={card.title} value={card.value} sub={"sub" in card ? card.sub : undefined} icon={card.icon} tone={card.tone} />
      ))}
    </div>
  );
}