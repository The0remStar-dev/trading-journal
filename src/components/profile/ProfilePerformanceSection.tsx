import { Activity, Hash, Lock, Scale, Shield, Target, TrendingDown, TrendingUp, LineChart as LineChartIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { EquityCurveRChart } from "@/components/analytics/EquityCurveRChart";
import type { EquityPointR } from "@/types/analytics";
import type { ProfileAccessFlags, PublicPerformance, PublicStats } from "@/types/publicProfile";

interface Props {
  access: ProfileAccessFlags;
  performance: PublicPerformance | null;
  stats: PublicStats | null;
  history: EquityPointR[] | null;
}

function Locked({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <EmptyState icon={Lock} title={label} className="py-4" />
      </CardContent>
    </Card>
  );
}

export function ProfilePerformanceSection({ access, performance, stats, history }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">Performance</h2>
        {!access.performance || !performance ? (
          <Locked label="Performance non partagée par ce trader" />
        ) : !performance.hasData ? (
          <Card>
            <CardContent className="p-4">
              <EmptyState icon={LineChartIcon} title="Pas encore de trade clôturé" className="py-4" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <StatCard
              label="Total R"
              value={`${performance.totalR >= 0 ? "+" : ""}${performance.totalR}R`}
              icon={performance.totalR >= 0 ? TrendingUp : TrendingDown}
              tone={performance.totalR >= 0 ? "win" : "loss"}
            />
            <StatCard
              label="Win Rate"
              value={`${performance.winRate}%`}
              icon={Target}
              tone={performance.winRate >= 50 ? "win" : "loss"}
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">Statistiques</h2>
        {!access.stats || !stats ? (
          <Locked label="Statistiques non partagées par ce trader" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Trades clôturés" value={String(stats.tradesCount)} icon={Hash} tone="neutral" />
            <StatCard
              label="Profit Factor"
              value={stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : "∞"}
              icon={Scale}
              tone={stats.profitFactor === null || stats.profitFactor >= 1 ? "win" : "loss"}
            />
            <StatCard
              label="Expectancy"
              value={`${stats.expectancyR >= 0 ? "+" : ""}${stats.expectancyR}R`}
              icon={Activity}
              tone={stats.expectancyR >= 0 ? "win" : "loss"}
            />
            <StatCard
              label="R moyen"
              value={`${stats.avgR >= 0 ? "+" : ""}${stats.avgR}R`}
              icon={Activity}
              tone={stats.avgR >= 0 ? "win" : "loss"}
            />
            <StatCard label="Max Drawdown" value={`${stats.maxDrawdownR}R`} icon={Shield} tone="neutral" />
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">Historique</h2>
        {!access.history || !history ? (
          <Locked label="Historique non partagé par ce trader" />
        ) : (
          <EquityCurveRChart data={history} />
        )}
      </section>
    </div>
  );
}
