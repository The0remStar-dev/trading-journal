"use client";

import { useCallback, useEffect, useState } from "react";
import type { Trade, TradeInput } from "@/types/trade";

/**
 * Fetches all trades once on mount and exposes CRUD helpers that keep
 * local state in sync without a full refetch on every mutation.
 */
export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trades");
      if (!res.ok) throw new Error("Failed to load trades.");
      const data = await res.json();
      setTrades(data.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createTrade = useCallback(async (input: TradeInput) => {
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create trade.");
    const data = await res.json();
    setTrades((prev) => [data.trade, ...prev]);
    return data.trade as Trade;
  }, []);

  const updateTrade = useCallback(async (id: string, input: TradeInput) => {
    const res = await fetch(`/api/trades/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to update trade.");
    const data = await res.json();
    setTrades((prev) => prev.map((t) => (t.id === id ? data.trade : t)));
    return data.trade as Trade;
  }, []);

  const deleteTrade = useCallback(async (id: string) => {
    const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete trade.");
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { trades, loading, error, refetch, createTrade, updateTrade, deleteTrade };
}
