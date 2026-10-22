import { prisma } from "@/lib/prisma";
import { serializeTrade } from "@/lib/serialize";
import { computeRiskAmount, tradeToR } from "@/lib/rMultiple";
import { computeGlobalPerformance, computeEquityCurveR } from "@/lib/analytics";
import type { EquityPointR } from "@/types/analytics";
import type { PublicPerformance, PublicStats, PublicTradeRow } from "@/types/publicProfile";

interface AllowedSections {
  performance: boolean;
  stats: boolean;
  trades: boolean;
  history: boolean;
}

export interface PublicTradingData {
  performance: PublicPerformance | null;
  stats: PublicStats | null;
  history: EquityPointR[] | null;
  trades: PublicTradeRow[] | null;
}

const RECENT_TRADES_LIMIT = 20;

/**
 * Minimisation des données : seules les sections explicitement autorisées
 * sont calculées et retournées. Si rien n'est autorisé, aucune requête
 * sur les trades n'est même exécutée.
 *
 * Périmètre : trades de compte LIVE uniquement. Les fonctions de calcul
 * sont les mêmes que pour le Dashboard et Analytics.
 * Aucun montant monétaire n'est jamais retourné, uniquement des R.
 */
export async function buildPublicTradingData(userId: string, allowed: AllowedSections): Promise<PublicTradingData> {
  if (!allowed.performance && !allowed.stats && !allowed.trades && !allowed.history) {
    return { performance: null, stats: null, history: null, trades: null };
  }

  const [profile, rows] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: userId },
      select: { initialCapital: true, riskPerTradePercent: true },
    }),
    prisma.trade.findMany({
      where: { userId, accountType: "LIVE" },
      orderBy: { entryDate: "asc" },
    }),
  ]);

  const trades = rows.map(serializeTrade);
  const fallbackRiskAmount = computeRiskAmount({
    initialCapital: profile?.initialCapital ?? null,
    riskPerTradePercent: profile?.riskPerTradePercent ?? null,
  });

  const global = computeGlobalPerformance(trades, fallbackRiskAmount);

  const performance: PublicPerformance | null = allowed.performance
    ? {
        totalR: global.totalR,
        winRate: global.winRate,
        hasData: global.closedTrades - global.tradesMissingRiskData > 0,
      }
    : null;

  const stats: PublicStats | null = allowed.stats
    ? {
        tradesCount: global.closedTrades,
        profitFactor: Number.isFinite(global.profitFactor) ? global.profitFactor : null,
        expectancyR: global.expectancyR,
        avgR: global.avgR,
        maxDrawdownR: global.maxDrawdownR,
      }
    : null;

  const history = allowed.history ? computeEquityCurveR(trades, fallbackRiskAmount) : null;

  const tradeList: PublicTradeRow[] | null = allowed.trades
    ? trades
        .filter((t) => t.status !== "OPEN") // jamais de position ouverte en public
        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
        .slice(0, RECENT_TRADES_LIMIT)
        .map((t) => {
          const r = t.rMultiple ?? tradeToR(t.pnl, false, fallbackRiskAmount);
          return {
            symbol: t.symbol,
            direction: t.direction,
            entryDate: t.entryDate,
            status: t.status,
            rMultiple: r !== null ? Number(r.toFixed(2)) : null,
            tags: t.tags.slice(0, 3),
          };
        })
    : null;

  return { performance, stats, history, trades: tradeList };
}