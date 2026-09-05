"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MonthSelector } from "@/components/stats/MonthSelector";
import { MonthlyRetrospectiveCard } from "@/components/stats/MonthlyRetrospectiveCard";
import { useMonthlyStats } from "@/lib/useMonthlyStats";

export default function MonthlyRetrospectivePage() {
  const { months, selectedMonth, setSelectedMonth, stats, loading, error } = useMonthlyStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Rétrospective Mensuelle</h1>
            <p className="text-sm text-muted">Analysez votre mois pour identifier ce qui a fonctionné.</p>
          </div>
          {months.length > 0 && (
            <MonthSelector months={months} value={selectedMonth} onChange={setSelectedMonth} />
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
            {error}
          </div>
        )}

        {loading || !stats ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg border border-border bg-surface" />
              ))}
            </div>
            <div className="h-40 rounded-lg border border-border bg-surface" />
          </div>
        ) : (
          <MonthlyRetrospectiveCard stats={stats} />
        )}
      </main>
    </div>
  );
}