import { TrendingUp, TrendingDown, Target, Activity, Scale, Hash } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { GlobalPerformance } from "@/types/analytics";

export function PerformanceStats({ global }: { global: GlobalPerformance }) {
  const positive = global.totalR >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Total R"
        value={`${global.totalR >= 0 ? "+" : ""}${global.totalR}R`}
        icon={positive ? TrendingUp : TrendingDown}
        tone={positive ? "win" : "loss"}
      />
      <StatCard
        label="Win Rate"
        value={`${global.winRate}%`}
        icon={Target}
        tone={global.winRate >= 50 ? "win" : "loss"}
      />
      <StatCard
        label="Expectancy"
        value={`${global.expectancyR >= 0 ? "+" : ""}${global.expectancyR}R`}
        icon={Activity}
        tone={global.expectancyR >= 0 ? "win" : "loss"}
      />
      <StatCard
        label="Profit Factor"
        value={Number.isFinite(global.profitFactor) ? global.profitFactor.toFixed(2) : "∞"}
        icon={Scale}
        tone={global.profitFactor >= 1 ? "win" : "loss"}
      />
      <StatCard label="Trades" value={String(global.totalTrades)} icon={Hash} tone="neutral" />
    </div>
  );
}