"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { EquityCurveChart } from "@/components/dashboard/EquityCurveChart";
import { DayOfWeekChart } from "@/components/dashboard/DayOfWeekChart";
import { TagPerformance } from "@/components/dashboard/TagPerformance";
import { Button } from "@/components/ui/button";
import { useTrades } from "@/lib/useTrades";
import {
  computeKpis,
  computeEquityCurve,
  computeWinRateByDayOfWeek,
  computeTagPerformance,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { startOfWeek, startOfMonth, isAfter } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type RangeKey = "week" | "month" | "all" | "custom";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { trades, loading, error } = useTrades();
  const [range, setRange] = useState<RangeKey>("all");

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
      } else {
        setUser(data.user);
        setCheckingAuth(false);
      }
    }
    getUser();
  }, [supabase, router]);

  const filteredTrades = useMemo(() => {
    if (range === "all") return trades;
    const now = new Date();
    const cutoff = range === "week" ? startOfWeek(now) : startOfMonth(now);
    return trades.filter((t) => isAfter(new Date(t.entryDate), cutoff));
  }, [trades, range]);

  const kpis = useMemo(() => computeKpis(filteredTrades), [filteredTrades]);
  const equityCurve = useMemo(() => computeEquityCurve(filteredTrades), [filteredTrades]);
  const dayOfWeek = useMemo(() => computeWinRateByDayOfWeek(filteredTrades), [filteredTrades]);
  const tagPerf = useMemo(() => computeTagPerformance(filteredTrades), [filteredTrades]);

  // Si on est en train de vérifier l'authentification, on affiche un écran vide ou de chargement
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted">
              {user ? `Connecté en tant que ${user.email}` : "Performance overview across all your trades."}
            </p>
          </div>
          <div className="flex gap-1 rounded-md border border-border bg-surface p-1">
            {RANGE_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                size="sm"
                variant={range === opt.key ? "default" : "ghost"}
                className={cn(range !== opt.key && "text-muted")}
                onClick={() => setRange(opt.key)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
            {error}
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="flex flex-col gap-4">
            <KpiCards kpis={kpis} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <EquityCurveChart data={equityCurve} />
              <DayOfWeekChart data={dayOfWeek} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <TagPerformance data={tagPerf} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-border bg-surface" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-lg border border-border bg-surface lg:col-span-2" />
        <div className="h-72 rounded-lg border border-border bg-surface" />
      </div>
    </div>
  );
}