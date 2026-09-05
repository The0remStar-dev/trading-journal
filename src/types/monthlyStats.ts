import type { TradeEmotion } from "@/types/trade";

export interface MonthlyStatsResponse {
  month: string; // "2026-02"
  hasData: boolean;
  netPnl: number;
  netPnlR: number | null;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  bestAsset: { symbol: string; totalR: number } | null;
  bestStrategy: { tag: string; totalR: number } | null;
  emotionalBreakdown: { emotion: TradeEmotion; totalR: number; totalTrades: number }[];
  bestEmotion: { emotion: TradeEmotion; totalR: number } | null;
  worstEmotion: { emotion: TradeEmotion; totalR: number } | null;
  riskAmount: number | null;
}

export interface AvailableMonth {
  value: string; // "2026-02"
  label: string; // "Février 2026"
}