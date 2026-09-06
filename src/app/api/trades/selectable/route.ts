import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { computeRiskAmount, tradeToR } from "@/lib/rMultiple";
import type { SelectableTrade } from "@/types/post";
import type { Prisma } from "@prisma/client";

// GET /api/trades/selectable?symbol=&dateFrom=&dateTo=
// Utilisé par le sélecteur d'import de post : ne renvoie JAMAIS pnl/fees,
// uniquement le contexte de marché + le R-multiple déjà normalisé.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const where: Prisma.TradeWhereInput = {
    userId: user.id,
    // Seuls les trades clôturés ont un résultat partageable.
    status: { in: ["WIN", "LOSS", "BREAKEVEN"] },
  };

  const symbol = searchParams.get("symbol");
  if (symbol) where.symbol = { contains: symbol.toUpperCase() };

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    where.entryDate = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const [profile, trades] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id } }),
    prisma.trade.findMany({ where, orderBy: { entryDate: "desc" }, take: 100 }),
  ]);

  const riskAmount = computeRiskAmount({
    initialCapital: profile?.initialCapital ?? null,
    riskPerTradePercent: profile?.riskPerTradePercent ?? null,
  });

  const selectable: SelectableTrade[] = trades.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    direction: t.direction,
    entryDate: t.entryDate.toISOString(),
    exitDate: t.exitDate ? t.exitDate.toISOString() : null,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    rMultiple: tradeToR(t.pnl, false, riskAmount),
    // t.pnl et t.fees ne quittent JAMAIS cette fonction.
  }));

  return NextResponse.json({
    trades: selectable,
    riskConfigured: riskAmount !== null,
  });
}