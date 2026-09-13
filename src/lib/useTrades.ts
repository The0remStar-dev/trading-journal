"use client";

import { useCallback, useEffect, useState } from "react";
import type { Trade, TradeInput } from "@/types/trade";

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trades", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Impossible de charger les trades.");
      }
      const data = await res.json();
      setTrades(data.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Échec de la création du trade.");
    setTrades((prev) => [data.trade, ...prev]);
    return data.trade as Trade;
  }, []);

  const updateTrade = useCallback(async (id: string, input: TradeInput) => {
    const res = await fetch(`/api/trades/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Échec de la mise à jour du trade.");
    setTrades((prev) => prev.map((t) => (t.id === id ? data.trade : t)));
    return data.trade as Trade;
  }, []);

  const deleteTrade = useCallback(async (id: string) => {
    const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Échec de la suppression du trade.");
    }
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { trades, loading, error, refetch, createTrade, updateTrade, deleteTrade };
}