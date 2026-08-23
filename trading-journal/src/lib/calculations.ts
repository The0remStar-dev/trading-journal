import type { Trade } from "@/types/trade";

/**
 * Computes raw PnL in account currency for a trade.
 * LONG: (exit - entry) * size - fees
 * SHORT: (entry - exit) * size - fees
 */
export function calculatePnl(params: {
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number | null | undefined;
  positionSize: number;
  fees: number;
}): number {
  const { direction, entryPrice, exitPrice, positionSize, fees } = params;
  if (exitPrice === null || exitPrice === undefined || Number.isNaN(exitPrice)) return 0;

  const rawDiff = direction === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
  return rawDiff * positionSize - fees;
}

/**
 * Computes PnL as a percentage of capital risked (entry price * size).
 */
export function calculatePnlPercentage(params: {
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number | null | undefined;
  positionSize: number;
  fees: number;
}): number {
  const { entryPrice, positionSize } = params;
  const notional = entryPrice * positionSize;
  if (!notional) return 0;
  const pnl = calculatePnl(params);
  return (pnl / notional) * 100;
}

/**
 * Derives trade status from PnL, treating trades without an exit price as OPEN.
 */
export function deriveStatus(params: {
  exitPrice: number | null | undefined;
  pnl: number;
}): "WIN" | "LOSS" | "BREAKEVEN" | "OPEN" {
  const { exitPrice, pnl } = params;
  if (exitPrice === null || exitPrice === undefined || Number.isNaN(exitPrice)) return "OPEN";
  if (Math.abs(pnl) < 0.005) return "BREAKEVEN";
  return pnl > 0 ? "WIN" : "LOSS";
}

export interface KpiSummary {
  totalNetPnl: number;
  totalNetPnlPercentage: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  bestTrade: number;
  worstTrade: number;
}

/**
 * Aggregates dashboard KPIs from a list of closed + open trades.
 * Open trades are excluded from win-rate / profit-factor math but counted in totalTrades.
 */
export function computeKpis(trades: Trade[]): KpiSummary {
  const closed = trades.filter((t) => t.status !== "OPEN");
  const wins = closed.filter((t) => t.status === "WIN");
  const losses = closed.filter((t) => t.status === "LOSS");

  const totalNetPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

  const totalRisked = trades.reduce((sum, t) => sum + t.entryPrice * t.positionSize, 0);

  return {
    totalNetPnl,
    totalNetPnlPercentage: totalRisked ? (totalNetPnl / totalRisked) * 100 : 0,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    avgWin: wins.length ? grossProfit / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    totalTrades: trades.length,
    bestTrade: trades.length ? Math.max(...trades.map((t) => t.pnl)) : 0,
    worstTrade: trades.length ? Math.min(...trades.map((t) => t.pnl)) : 0,
  };
}

/**
 * Builds cumulative equity curve points sorted by entry date.
 */
export function computeEquityCurve(trades: Trade[]) {
  const sorted = [...trades]
    .filter((t) => t.status !== "OPEN")
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  let cumulative = 0;
  return sorted.map((t) => {
    cumulative += t.pnl;
    return {
      date: t.entryDate,
      cumulativePnl: Number(cumulative.toFixed(2)),
      tradePnl: t.pnl,
    };
  });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Win rate broken down by day-of-week (Mon–Fri only, per spec).
 */
export function computeWinRateByDayOfWeek(trades: Trade[]) {
  const closed = trades.filter((t) => t.status === "WIN" || t.status === "LOSS");
  const buckets: Record<string, { wins: number; total: number }> = {
    Mon: { wins: 0, total: 0 },
    Tue: { wins: 0, total: 0 },
    Wed: { wins: 0, total: 0 },
    Thu: { wins: 0, total: 0 },
    Fri: { wins: 0, total: 0 },
  };

  for (const t of closed) {
    const day = DAY_LABELS[new Date(t.entryDate).getDay()];
    if (!(day in buckets)) continue; // skip weekend trades
    buckets[day].total += 1;
    if (t.status === "WIN") buckets[day].wins += 1;
  }

  return Object.entries(buckets).map(([day, { wins, total }]) => ({
    day,
    winRate: total ? Number(((wins / total) * 100).toFixed(1)) : 0,
    total,
  }));
}

export interface TagPerformance {
  tag: string;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
}

/**
 * Aggregates PnL and win rate per strategy tag.
 */
export function computeTagPerformance(trades: Trade[]): TagPerformance[] {
  const map = new Map<string, { pnl: number; wins: number; total: number }>();

  for (const t of trades) {
    for (const tag of t.tags) {
      const entry = map.get(tag) ?? { pnl: 0, wins: 0, total: 0 };
      entry.pnl += t.pnl;
      if (t.status === "WIN" || t.status === "LOSS") {
        entry.total += 1;
        if (t.status === "WIN") entry.wins += 1;
      }
      map.set(tag, entry);
    }
  }

  return Array.from(map.entries())
    .map(([tag, { pnl, wins, total }]) => ({
      tag,
      totalPnl: Number(pnl.toFixed(2)),
      winRate: total ? Number(((wins / total) * 100).toFixed(1)) : 0,
      totalTrades: total,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl);
}
