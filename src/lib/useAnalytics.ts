"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsResponse, PeriodPreset, SessionName } from "@/types/analytics";
import type { Direction, Timeframe } from "@/types/trade";

export interface AnalyticsFilterState {
  instrument: string | null;
  setup: string | null;
  session: SessionName | null;
  timeframe: Timeframe | null;
  direction: Direction | null;
}

const EMPTY_FILTERS: AnalyticsFilterState = {
  instrument: null,
  setup: null,
  session: null,
  timeframe: null,
  direction: null,
};

export function useAnalytics(initialPreset: PeriodPreset = "30d") {
  const [preset, setPreset] = useState<PeriodPreset>(initialPreset);
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilterState>(EMPTY_FILTERS);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ preset });
      if (preset === "custom") {
        if (customFrom) params.set("from", customFrom);
        if (customTo) params.set("to", customTo);
      }
      if (filters.instrument) params.set("instrument", filters.instrument);
      if (filters.setup) params.set("setup", filters.setup);
      if (filters.session) params.set("session", filters.session);
      if (filters.timeframe) params.set("timeframe", filters.timeframe);
      if (filters.direction) params.set("direction", filters.direction);

      const res = await fetch(`/api/stats/analytics?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Impossible de charger les statistiques.");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
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
    refetch: fetchData,
  };
}