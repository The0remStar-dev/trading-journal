"use client";

import { useCallback, useEffect, useState } from "react";
import type { MonthlyStatsResponse, AvailableMonth } from "@/types/monthlyStats";

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useMonthlyStats() {
  const [months, setMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue());
  const [stats, setStats] = useState<MonthlyStatsResponse | null>(null);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMonths() {
      setLoadingMonths(true);
      try {
        const res = await fetch("/api/stats/monthly/months", { cache: "no-store" });
        if (!res.ok) throw new Error("Impossible de charger la liste des mois.");
        const data = await res.json();
        setMonths(data.months);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        setLoadingMonths(false);
      }
    }
    loadMonths();
  }, []);

  const fetchStats = useCallback(async (month: string) => {
    setLoadingStats(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats/monthly?month=${month}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger la rétrospective.");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(selectedMonth);
  }, [selectedMonth, fetchStats]);

  return { months, selectedMonth, setSelectedMonth, stats, loading: loadingMonths || loadingStats, error };
}