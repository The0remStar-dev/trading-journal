import type { Direction, Timeframe } from "@/types/trade";

export type PeriodPreset = "today" | "week" | "month" | "7d" | "30d" | "90d" | "year" | "all" | "custom";

export interface PeriodRange {
  from: string | null;
  to: string | null;
}

export interface TradeExtreme {
  id: string;
  symbol: string;
  entryDate: string;
  rMultiple: number;
}

export interface GlobalPerformance {
  totalR: number;
  avgR: number;
  winRate: number;
  lossRate: number;
  avgWinR: number;
  avgLossR: number;
  profitFactor: number;
  expectancyR: number;
  maxDrawdownR: number;
  recoveryFactor: number | null;
  totalTrades: number;
  closedTrades: number;
  bestWinStreak: { count: number; totalR: number };
  worstLossStreak: { count: number; totalR: number };
  bestDay: { date: string; totalR: number } | null;
  worstDay: { date: string; totalR: number } | null;
  bestTrade: TradeExtreme | null;
  worstTrade: TradeExtreme | null;
  tradesMissingRiskData: number;
}

export interface BreakdownEntry {
  key: string;
  totalR: number;
  avgR: number;
  winRate: number;
  totalTrades: number;
}

export interface EquityPointR {
  date: string;
  cumulativeR: number;
  tradeR: number;
}

export type SessionName = "Asie" | "Londres" | "New York" | "Autres";

export interface RiskAnalysis {
  avgRiskRatio: number | null;
  riskStdDev: number | null;
  outlierTrades: { id: string; symbol: string; entryDate: string; riskRatio: number; rMultiple: number | null }[];
  tradesWithStopData: number;
  tradesWithoutStopData: number;
  behaviorAfterLoss: { avgRAfterLoss: number | null; avgRAfterWin: number | null } | null;
}

export interface BehavioralPattern {
  id: string;
  severity: "info" | "warning" | "positive";
  title: string;
  description: string;
  occurrences?: number;
}

// Filtres supportés par le service centralisé getUserTradingStats.
export interface TradingStatsFilters {
  preset: PeriodPreset;
  from?: string | null;
  to?: string | null;
  instrument?: string | null;
  setup?: string | null; // filtre sur les tags
  session?: SessionName | null;
  timeframe?: Timeframe | null;
  direction?: Direction | null;
}

export interface AnalyticsResponse {
  period: PeriodRange;
  global: GlobalPerformance;
  byInstrument: BreakdownEntry[];
  byTag: BreakdownEntry[];
  bySession: BreakdownEntry[];
  byTimeframe: BreakdownEntry[];
  equityCurve: EquityPointR[];
  hourlyHeatmap: { hour: number; dayOfWeek: number; avgR: number; totalTrades: number }[];
  risk: RiskAnalysis;
  patterns: BehavioralPattern[];
}