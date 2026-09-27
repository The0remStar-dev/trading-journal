import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { serializeTrade } from "@/lib/serialize";
import { computeRiskAmount } from "@/lib/rMultiple";
import {
  computeGlobalPerformance,
  computeByInstrument,
  computeByTag,
  computeBySession,
  computeByTimeframe,
  computeByDirection,
  computeByDayOfWeek,
  computeEquityCurveR,
  computeHourlyHeatmap,
  computeRDistribution,
  computeStreakDistribution,
  computeRiskAnalysis,
  detectBehavioralPatterns,
  computeInsightSummaries,
  deriveSession,
} from "@/lib/analytics";
import type { AnalyticsResponse, PeriodPreset, TradingStatsFilters } from "@/types/analytics";
import type { Prisma } from "@prisma/client";

function resolveDateRange(preset: PeriodPreset, from?: string | null, to?: string | null) {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: now };
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
    case "month":
      return { from: startOfMonth(now), to: now };
    case "7d":
      return { from: subDays(now, 7), to: now };
    case "30d":
      return { from: subDays(now, 30), to: now };
    case "90d":
      return { from: subDays(now, 90), to: now };
    case "year":
      return { from: startOfYear(now), to: now };
    case "custom":
      return {
        from: from ? new Date(from) : null,
        to: to ? new Date(to) : null,
      };
    case "all":
    default:
      return { from: null, to: null };
  }
}

/**
 * Point d'entrée UNIQUE pour tout calcul de statistiques de trading.
 * Dashboard et Analytics appellent tous les deux cette fonction — jamais de
 * logique de calcul dupliquée ailleurs, pour garantir des chiffres identiques
 * partout dans l'application.
 *
 * Isolation multi-utilisateur : toutes les requêtes Prisma sont scopées par
 * `userId`, qui provient exclusivement de la session Supabase authentifiée
 * côté route — jamais d'un paramètre client.
 */
export async function getUserTradingStats(
  userId: string,
  filters: TradingStatsFilters
): Promise<AnalyticsResponse> {
  const range = resolveDateRange(filters.preset, filters.from, filters.to);

  const where: Prisma.TradeWhereInput = {
    userId,
    ...(range.from || range.to
      ? {
          entryDate: {
            ...(range.from ? { gte: range.from } : {}),
            ...(range.to ? { lte: range.to } : {}),
          },
        }
      : {}),
    ...(filters.instrument ? { symbol: { contains: filters.instrument.toUpperCase() } } : {}),
    ...(filters.direction ? { direction: filters.direction } : {}),
    ...(filters.timeframe ? { timeframe: filters.timeframe } : {}),
    ...(filters.result ? { status: filters.result } : {}),
  };

  const [profile, tradeRows] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.trade.findMany({ where, orderBy: { entryDate: "asc" } }),
  ]);

  let trades = tradeRows.map(serializeTrade);

  // Filtres non exprimables directement en SQL (tags JSON, session dérivée).
  if (filters.setup) {
    trades = trades.filter((t) => t.tags.includes(filters.setup!));
  }
  if (filters.session) {
    trades = trades.filter((t) => deriveSession(t.entryDate) === filters.session);
  }

  const fallbackRiskAmount = computeRiskAmount({
    initialCapital: profile?.initialCapital ?? null,
    riskPerTradePercent: profile?.riskPerTradePercent ?? null,
  });

  return {
    period: {
      from: range.from ? range.from.toISOString() : null,
      to: range.to ? range.to.toISOString() : null,
    },
    global: computeGlobalPerformance(trades, fallbackRiskAmount),
    byInstrument: computeByInstrument(trades, fallbackRiskAmount),
    byTag: computeByTag(trades, fallbackRiskAmount),
    bySession: computeBySession(trades, fallbackRiskAmount),
    byTimeframe: computeByTimeframe(trades, fallbackRiskAmount),
    byDirection: computeByDirection(trades, fallbackRiskAmount),
    byDayOfWeek: computeByDayOfWeek(trades, fallbackRiskAmount),
    equityCurve: computeEquityCurveR(trades, fallbackRiskAmount),
    hourlyHeatmap: computeHourlyHeatmap(trades, fallbackRiskAmount),
    rDistribution: computeRDistribution(trades, fallbackRiskAmount),
    streakDistribution: computeStreakDistribution(trades, fallbackRiskAmount),
    risk: computeRiskAnalysis(trades, fallbackRiskAmount),
    patterns: detectBehavioralPatterns(trades, fallbackRiskAmount),
    insightSummaries: computeInsightSummaries(trades, fallbackRiskAmount),
  };
}