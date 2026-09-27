"use client";

import { AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { GlobalKpiGrid } from "@/components/analytics/GlobalKpiGrid";
import { EquityCurveRChart } from "@/components/analytics/EquityCurveRChart";
import { BreakdownBars } from "@/components/analytics/BreakdownBars";
import { HourlyHeatmap } from "@/components/analytics/HourlyHeatmap";
import { DirectionComparisonCard } from "@/components/analytics/DirectionComparisonCard";
import { DayOfWeekBarChart } from "@/components/analytics/DayOfWeekBarChart";
import { RDistributionChart } from "@/components/analytics/RDistributionChart";
import { InsightSummaryCard } from "@/components/analytics/InsightSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import { useAnalytics } from "@/lib/useAnalytics";

function RiskPanelFallback({ risk }: { risk?: object | null }) {
  const entries = risk && typeof risk === "object" ? Object.entries(risk as Record<string, unknown>) : [];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-medium text-foreground">Risk</h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Aucune donnée de risque disponible.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {entries.slice(0, 4).map(([key, value]) => (
            <li
              key={key}
              className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 last:border-b-0 last:pb-0"
            >
              <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
              <span className="font-medium text-foreground">{String(value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const {
    data,
    loading,
    error,
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    filters,
    setFilters,
    resetFilters,
  } = useAnalytics("30d");

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted">
          Comprends pourquoi tu gagnes ou perds, et quelle habitude corriger.
        </p>
      </div>

      <div className="mb-5">
        <AnalyticsFilterBar
          preset={preset}
          onPresetChange={setPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : data.global.totalTrades === 0 ? (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon={BarChart3}
            title="Aucun trade sur cette sélection"
            description="Ajuste tes filtres ou logge de nouveaux trades pour voir apparaître ton analyse."
            className="py-16"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <GlobalKpiGrid global={data.global} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <EquityCurveRChart data={data.equityCurve} />
            <HourlyHeatmap data={data.hourlyHeatmap} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BreakdownBars title="Par instrument" data={data.byInstrument} emptyMessage="Aucune donnée par instrument." />
            <BreakdownBars title="Par setup / stratégie" data={data.byTag} emptyMessage="Ajoutez des tags à vos trades." />
            <DirectionComparisonCard data={data.byDirection} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DayOfWeekBarChart data={data.byDayOfWeek} />
            <RDistributionChart data={data.rDistribution} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InsightSummaryCard summaries={data.insightSummaries} />
            <RiskPanelFallback risk={data.risk} />
          </div>

        </div>
      )}
    </AppShell>
  );
}