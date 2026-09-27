import type { Trade } from "@/types/trade";

export interface RMultipleContext {
  initialCapital: number | null;
  riskPerTradePercent: number | null;
}

export function computeRiskAmount(ctx: RMultipleContext): number | null {
  if (!ctx.initialCapital || !ctx.riskPerTradePercent) return null;
  const amount = ctx.initialCapital * (ctx.riskPerTradePercent / 100);
  return amount > 0 ? amount : null;
}

/**
 * Détermine le risque réellement utilisé pour normaliser un trade en R.
 *
 * Priorité :
 * 1. Risque planifié réel : |entrée - stop| × taille de position, si un
 *    Stop Loss est renseigné. C'est la définition la plus fidèle du "risque
 *    pris sur ce trade précis".
 * 2. Repli : montant de risque du profil (capital × % de risque), pour les
 *    trades sans Stop Loss renseigné.
 *
 * riskAmount est toujours strictement positif quand il existe, ce qui
 * garantit que rMultiple (= pnl / riskAmount) a toujours le même signe que
 * pnl — élimine structurellement toute incohérence "PnL positif, R négatif".
 */
export function computeTradeRiskAmount(params: {
  entryPrice: number;
  stopLoss: number | null;
  positionSize: number;
  fallbackRiskAmount: number | null;
}): { riskAmount: number | null; source: "stop" | "capital_fallback" | "unavailable" } {
  const { entryPrice, stopLoss, positionSize, fallbackRiskAmount } = params;

  if (stopLoss !== null && positionSize > 0) {
    const diff = Math.abs(entryPrice - stopLoss);
    if (diff > 0) {
      return { riskAmount: diff * positionSize, source: "stop" };
    }
  }

  if (fallbackRiskAmount !== null && fallbackRiskAmount > 0) {
    return { riskAmount: fallbackRiskAmount, source: "capital_fallback" };
  }

  return { riskAmount: null, source: "unavailable" };
}

export function tradeToR(pnl: number, isOpen: boolean, riskAmount: number | null): number | null {
  if (isOpen || riskAmount === null) return null;
  return pnl / riskAmount;
}

export interface GroupedRPerformance {
  key: string;
  totalR: number;
  totalTrades: number;
}

function groupByR(
  trades: Trade[],
  riskAmount: number | null,
  getKeys: (trade: Trade) => string[]
): GroupedRPerformance[] {
  const map = new Map<string, { totalR: number; totalTrades: number }>();

  for (const trade of trades) {
    if (trade.status === "OPEN") continue;
    const r = tradeToR(trade.pnl, false, riskAmount);
    if (r === null) continue;

    for (const key of getKeys(trade)) {
      const entry = map.get(key) ?? { totalR: 0, totalTrades: 0 };
      entry.totalR += r;
      entry.totalTrades += 1;
      map.set(key, entry);
    }
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({ key, totalR: Number(v.totalR.toFixed(2)), totalTrades: v.totalTrades }))
    .sort((a, b) => b.totalR - a.totalR);
}

export function computeBestTag(trades: Trade[], riskAmount: number | null): GroupedRPerformance | null {
  const grouped = groupByR(trades, riskAmount, (t) => t.tags);
  return grouped.length > 0 && grouped[0].totalR > 0 ? grouped[0] : null;
}

export function computeBestSymbol(trades: Trade[], riskAmount: number | null): GroupedRPerformance | null {
  const grouped = groupByR(trades, riskAmount, (t) => [t.symbol]);
  return grouped.length > 0 && grouped[0].totalR > 0 ? grouped[0] : null;
}

export function computeEmotionalBreakdown(trades: Trade[], riskAmount: number | null): GroupedRPerformance[] {
  return groupByR(trades, riskAmount, (t) => (t.emotion ? [t.emotion] : []));
}