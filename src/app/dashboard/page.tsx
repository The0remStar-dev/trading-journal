"use client";

import { useState } from "react";
import { AlertCircle, NotebookText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { PerformanceStats } from "@/components/dashboard/PerformanceStats";
import { ProgressionCard } from "@/components/dashboard/ProgressionCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { EdgeCard } from "@/components/dashboard/EdgeCard";
import { RecentTradesTable } from "@/components/dashboard/RecentTradesTable";
import { ProgressionLevelCard } from "@/components/dashboard/ProgressionLevelCard";
import { CommunityCard } from "@/components/dashboard/CommunityCard";
import { DailyChecklist } from "@/components/dashboard/DailyChecklist";
import { InsufficientDataBanner } from "@/components/dashboard/InsufficientDataBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAnalytics } from "@/lib/useAnalytics";
import { useTrades } from "@/lib/useTrades";
import { useProfile } from "@/lib/useProfile";
import type { PeriodPreset } from "@/types/analytics";

export default function DashboardPage() {
  const { profile } = useProfile();
  const { trades, loading: tradesLoading, error: tradesError } = useTrades();

  const headerAnalytics = useAnalytics("week");
  const [progressionRange, setProgressionRange] = useState<PeriodPreset>("30d");
  const progressionAnalytics = useAnalytics(progressionRange);

  const firstName = profile?.fullName?.split(" ")[0] || profile?.username || "trader";

  const hasAnyError = headerAnalytics.error || tradesError;
  const hasNoTradesAtAll = !tradesLoading && trades.length === 0;

  return (
    <AppShell>
      <WelcomeHeader
        firstName={firstName}
        period={headerAnalytics.preset}
        onPeriodChange={headerAnalytics.setPreset}
      />

      {hasAnyError && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {headerAnalytics.error ?? tradesError}
        </div>
      )}

      {hasNoTradesAtAll ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon={NotebookText}
            title="Pas encore de trades"
            description="Ajoute ton premier trade pour commencer à voir tes performances."
            className="py-16"
          />
        </div>
      ) : (
        <>
          {headerAnalytics.data && (
            <InsufficientDataBanner closedTrades={headerAnalytics.data.global.closedTrades} />
          )}

          {headerAnalytics.loading || !headerAnalytics.data ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <PerformanceStats global={headerAnalytics.data.global} />
          )}
        </>
      )}

      {/* Communauté : désormais avant « Point d'attention » dans l'ordre de lecture.
          Visible même sans trade : elle ne dépend pas du journal. */}
      <div className="mt-4">
        <CommunityCard />
      </div>

      {!hasNoTradesAtAll && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProgressionCard
                data={progressionAnalytics.data?.equityCurve ?? []}
                loading={progressionAnalytics.loading}
                range={progressionRange}
                onRangeChange={(v) => {
                  setProgressionRange(v);
                  progressionAnalytics.setPreset(v);
                }}
              />
            </div>
            {headerAnalytics.data ? (
              <InsightCard patterns={headerAnalytics.data.patterns} />
            ) : (
              <Skeleton className="h-full min-h-[200px]" />
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {headerAnalytics.data ? (
              <EdgeCard
                byTag={headerAnalytics.data.byTag}
                byInstrument={headerAnalytics.data.byInstrument}
                bySession={headerAnalytics.data.bySession}
              />
            ) : (
              <Skeleton className="h-56" />
            )}
            <div className="lg:col-span-2">
              <RecentTradesTable trades={trades} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ProgressionLevelCard trades={trades} global={headerAnalytics.data?.global ?? null} />
            <DailyChecklist trades={trades} />
          </div>
        </>
      )}
    </AppShell>
  );
}