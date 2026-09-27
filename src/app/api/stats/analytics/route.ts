import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTradingStats } from "@/lib/tradingstats";
import type { PeriodPreset, SessionName, TradingStatsFilters } from "@/types/analytics";
import type { Direction, Timeframe, TradeStatus } from "@/types/trade";

// GET /api/stats/analytics?preset=&from=&to=&instrument=&setup=&session=&timeframe=&direction=&result=
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const filters: TradingStatsFilters = {
    preset: (searchParams.get("preset") ?? "30d") as PeriodPreset,
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    instrument: searchParams.get("instrument"),
    setup: searchParams.get("setup"),
    session: (searchParams.get("session") as SessionName | null) ?? null,
    timeframe: (searchParams.get("timeframe") as Timeframe | null) ?? null,
    direction: (searchParams.get("direction") as Direction | null) ?? null,
    result: (searchParams.get("result") as TradeStatus | null) ?? null,
  };

  try {
    const stats = await getUserTradingStats(user.id, filters);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Erreur lors du calcul des statistiques :", err);
    return NextResponse.json({ error: "Impossible de calculer les statistiques." }, { status: 500 });
  }
}