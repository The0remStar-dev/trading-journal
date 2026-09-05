import { TrendingUp, TrendingDown, Award, Target, Scale, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { EMOTION_LABELS } from "@/types/trade";
import type { MonthlyStatsResponse } from "@/types/monthlyStats";

export function MonthlyRetrospectiveCard({ stats }: { stats: MonthlyStatsResponse }) {
  if (!stats.hasData) {
    return (
      <Card>
        <CardContent className="flex h-56 flex-col items-center justify-center gap-1 p-6 text-center">
          <p className="text-sm text-muted">Aucun trade enregistré pour ce mois.</p>
          <p className="text-xs text-muted">Changez de mois ou commencez à logger vos trades.</p>
        </CardContent>
      </Card>
    );
  }

  const pnlPositive = stats.netPnl >= 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          title="Net PnL"
          value={formatCurrency(stats.netPnl)}
          icon={pnlPositive ? TrendingUp : TrendingDown}
          tone={pnlPositive ? "win" : "loss"}
        />
        <MetricCard
          title="Performance en R"
          value={stats.netPnlR !== null ? `${stats.netPnlR >= 0 ? "+" : ""}${stats.netPnlR}R` : "Non configuré"}
          sub={stats.netPnlR === null ? "Renseignez votre capital dans Paramètres" : undefined}
          icon={Target}
          tone={stats.netPnlR === null ? "neutral" : stats.netPnlR >= 0 ? "win" : "loss"}
        />
        <MetricCard
          title="Win Rate"
          value={formatPercent(stats.winRate, 1)}
          sub={`${stats.totalTrades} trades`}
          icon={Award}
          tone={stats.winRate >= 50 ? "win" : "loss"}
        />
        <MetricCard
          title="Profit Factor"
          value={Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞"}
          icon={Scale}
          tone={stats.profitFactor >= 1 ? "win" : "loss"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <HighlightCard
          title="Meilleure Stratégie"
          value={stats.bestStrategy ? stats.bestStrategy.tag : "—"}
          detail={stats.bestStrategy ? `+${stats.bestStrategy.totalR}R ce mois-ci` : "Aucun tag positif ce mois-ci"}
        />
        <HighlightCard
          title="Meilleur Actif"
          value={stats.bestAsset ? stats.bestAsset.symbol : "—"}
          detail={stats.bestAsset ? `+${stats.bestAsset.totalR}R ce mois-ci` : "Aucun actif positif ce mois-ci"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-foreground">
            <Brain className="h-4 w-4 text-accent-cyan" />
            Bilan émotionnel du mois
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {stats.emotionalBreakdown.length === 0 || stats.riskAmount === null ? (
            <p className="text-sm text-muted">
              {stats.riskAmount === null
                ? "Renseignez votre capital initial dans Paramètres pour activer cette analyse."
                : "Aucune émotion renseignée sur vos trades ce mois-ci."}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.bestEmotion && stats.worstEmotion && (
                <p className="text-sm text-foreground">
                  Ce mois-ci, vos trades marqués{" "}
                  <span className="font-medium text-loss">"{EMOTION_LABELS[stats.worstEmotion.emotion]}"</span>{" "}
                  ont généré <span className="font-medium text-loss">{stats.worstEmotion.totalR}R</span>, tandis
                  que vos trades{" "}
                  <span className="font-medium text-win">"{EMOTION_LABELS[stats.bestEmotion.emotion]}"</span> vous
                  ont rapporté <span className="font-medium text-win">+{stats.bestEmotion.totalR}R</span>.
                </p>
              )}
              <div className="flex flex-col gap-2">
                {stats.emotionalBreakdown.map((e) => (
                  <div key={e.emotion} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-sm text-foreground">
                      {EMOTION_LABELS[e.emotion]}
                    </span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-background">
                      <div
                        className={cn("h-full rounded-full", e.totalR >= 0 ? "bg-win/70" : "bg-loss/70")}
                        style={{ width: `${Math.min(100, Math.abs(e.totalR) * 10)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-16 shrink-0 text-right text-xs font-medium",
                        e.totalR >= 0 ? "text-win" : "text-loss"
                      )}
                    >
                      {e.totalR >= 0 ? "+" : ""}
                      {e.totalR}R
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone: "win" | "loss" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="text-[11px] uppercase tracking-wide">{title}</CardTitle>
          <Icon
            className={cn(
              "h-4 w-4",
              tone === "win" && "text-win",
              tone === "loss" && "text-loss",
              tone === "neutral" && "text-accent-cyan"
            )}
          />
        </div>
        <p
          className={cn(
            "text-mono-num text-xl font-semibold",
            tone === "win" && "text-win",
            tone === "loss" && "text-loss",
            tone === "neutral" && "text-foreground"
          )}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function HighlightCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted">{title}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </CardContent>
    </Card>
  );
}