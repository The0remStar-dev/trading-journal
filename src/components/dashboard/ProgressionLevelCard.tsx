import { Flame, Trophy, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { computeLevel, computeLoggingStreak } from "@/lib/gamification";
import type { Trade } from "@/types/trade";
import type { GlobalPerformance } from "@/types/analytics";

export function ProgressionLevelCard({ trades, global }: { trades: Trade[]; global: GlobalPerformance | null }) {
  const closedCount = trades.filter((t) => t.status !== "OPEN").length;
  const level = computeLevel(closedCount);
  const streak = computeLoggingStreak(trades);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Progression</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Niveau {level.level} — {level.label}
          </span>
          <span className="text-xs text-muted">{level.progressPercent}%</span>
        </div>
        <ProgressBar percent={level.progressPercent} tone="accent" />
        {level.tradesToNextLevel !== null && (
          <p className="mt-1.5 text-xs text-muted">
            {level.tradesToNextLevel} trade(s) avant le niveau suivant
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-loss" />
            <span className="text-sm text-foreground">{streak} jour{streak > 1 ? "s" : ""} de streak</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="text-sm text-foreground">0 challenge terminé</span>
          </div>
        </div>

        {global && (global.bestTrade || global.worstTrade) && (
          <div className="mt-3 flex flex-wrap gap-4 border-t border-border pt-3">
            {global.bestTrade && (
              <div className="flex items-center gap-1.5">
                <ArrowUp className="h-3.5 w-3.5 text-win" />
                <span className="text-xs text-muted">
                  Meilleur : <span className="font-medium text-win">+{global.bestTrade.rMultiple}R</span> ({global.bestTrade.symbol})
                </span>
              </div>
            )}
            {global.worstTrade && (
              <div className="flex items-center gap-1.5">
                <ArrowDown className="h-3.5 w-3.5 text-loss" />
                <span className="text-xs text-muted">
                  Pire : <span className="font-medium text-loss">{global.worstTrade.rMultiple}R</span> ({global.worstTrade.symbol})
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}