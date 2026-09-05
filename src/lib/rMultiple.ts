import type { Trade } from "@/types/trade";

export interface RMultipleContext {
  initialCapital: number | null;
  riskPerTradePercent: number | null;
}

/** Montant correspondant à 1R, déduit du capital initial et du % de risque par trade. */
export function computeRiskAmount(ctx: RMultipleContext): number | null {
  if (!ctx.initialCapital || !ctx.riskPerTradePercent) return null;
  const amount = ctx.initialCapital * (ctx.riskPerTradePercent / 100);
  return amount > 0 ? amount : null;
}

/** Convertit le PnL d'un trade clôturé en multiple de R. */
export function tradeToR(pnl: number, isOpen: boolean, riskAmount: number | null): number | null {
  if (isOpen || riskAmount === null) return null;
  return pnl / riskAmount;
}

export interface GroupedRPerformance {
  key: string;
  totalR: number;
  totalTrades: number;
}

/** Regroupe et somme les R par clé arbitraire (tag, symbole, émotion...). */
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