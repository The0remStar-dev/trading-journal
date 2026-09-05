// filepath: src/app/api/stats/monthly/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parse, isValid, startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { serializeTrade } from "@/lib/serialize";
import { computeKpis } from "@/lib/calculations";
import {
  computeRiskAmount,
  computeBestTag,
  computeBestSymbol,
  computeEmotionalBreakdown,
  tradeToR,
} from "@/lib/rMultiple";
import type { MonthlyStatsResponse } from "@/types/monthlyStats";

// GET /api/stats/monthly?month=YYYY-MM
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");

  // Résout le mois demandé, ou le mois en cours par défaut si absent/invalide.
  let referenceDate = new Date();
  if (monthParam) {
    const parsed = parse(monthParam, "yyyy-MM", new Date());
    if (isValid(parsed)) referenceDate = parsed;
  }

  const rangeStart = startOfMonth(referenceDate);
  const rangeEnd = endOfMonth(referenceDate);
  const monthKey = `${rangeStart.getFullYear()}-${String(rangeStart.getMonth() + 1).padStart(2, "0")}`;

  const [profile, tradeRows] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id } }),
    prisma.trade.findMany({
      where: {
        userId: user.id,
        entryDate: { gte: rangeStart, lte: rangeEnd },
      },
      orderBy: { entryDate: "asc" },
    }),
  ]);

  const trades = tradeRows.map(serializeTrade);

  if (trades.length === 0) {
    const empty: MonthlyStatsResponse = {
      month: monthKey,
      hasData: false,
      netPnl: 0,
      netPnlR: null,
      winRate: 0,
      profitFactor: 0,
      totalTrades: 0,
      bestAsset: null,
      bestStrategy: null,
      emotionalBreakdown: [],
      bestEmotion: null,
      worstEmotion: null,
      riskAmount: null,
    };
    return NextResponse.json(empty);
  }

  // Correction : riskPerTradePercent doit être lu depuis le profil,
  // pas codé en dur à null (c'est cette faute de frappe qui cassait
  // le calcul du R-multiple malgré un profil correctement rempli).
  const riskAmount = computeRiskAmount({
    initialCapital: profile?.initialCapital ?? null,
    riskPerTradePercent: profile?.riskPerTradePercent ?? null,
  });

  const kpis = computeKpis(trades);

  const closedTrades = trades.filter((t) => t.status !== "OPEN");
  const netPnlR =
    riskAmount !== null
      ? Number(
          closedTrades
            .reduce((sum, t) => sum + (tradeToR(t.pnl, false, riskAmount) ?? 0), 0)
            .toFixed(2)
        )
      : null;

  const bestTag = computeBestTag(trades, riskAmount);
  const bestSymbolGroup = computeBestSymbol(trades, riskAmount);
  const emotionalGroups = computeEmotionalBreakdown(trades, riskAmount);

  const bestEmotionGroup = emotionalGroups.length > 0 ? emotionalGroups[0] : null;
  const worstEmotionGroup = emotionalGroups.length > 0 ? emotionalGroups[emotionalGroups.length - 1] : null;

  const response: MonthlyStatsResponse = {
    month: monthKey,
    hasData: true,
    netPnl: kpis.totalNetPnl,
    netPnlR,
    winRate: kpis.winRate,
    profitFactor: kpis.profitFactor,
    totalTrades: kpis.totalTrades,
    bestAsset: bestSymbolGroup ? { symbol: bestSymbolGroup.key, totalR: bestSymbolGroup.totalR } : null,
    bestStrategy: bestTag ? { tag: bestTag.key, totalR: bestTag.totalR } : null,
    emotionalBreakdown: emotionalGroups.map((g) => ({
      emotion: g.key as any,
      totalR: g.totalR,
      totalTrades: g.totalTrades,
    })),
    bestEmotion:
      bestEmotionGroup && bestEmotionGroup.totalR > 0
        ? { emotion: bestEmotionGroup.key as any, totalR: bestEmotionGroup.totalR }
        : null,
    worstEmotion:
      worstEmotionGroup && worstEmotionGroup.totalR < 0
        ? { emotion: worstEmotionGroup.key as any, totalR: worstEmotionGroup.totalR }
        : null,
    riskAmount,
  };

  return NextResponse.json(response);
}