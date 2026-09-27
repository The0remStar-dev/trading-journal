import type { Trade as PrismaTrade } from "@prisma/client";
import type { Trade } from "@/types/trade";
import { deriveSession } from "@/lib/analytics";

export function serializeTrade(row: PrismaTrade): Trade {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags);
  } catch {
    tags = [];
  }

  const entryDateIso = row.entryDate.toISOString();

  return {
    id: row.id,
    accountType: row.accountType,
    symbol: row.symbol,
    direction: row.direction,
    entryDate: entryDateIso,
    exitDate: row.exitDate ? row.exitDate.toISOString() : null,
    entryPrice: row.entryPrice,
    exitPrice: row.exitPrice,
    stopLoss: (row as any).stopLoss ?? null,
    takeProfit: (row as any).takeProfit ?? null,
    positionSize: row.positionSize,
    fees: row.fees,
    pnl: row.pnl,
    pnlPercentage: row.pnlPercentage,
    riskRewardRatio: row.riskRewardRatio,
    riskAmount: (row as any).riskAmount ?? null,
    rMultiple: (row as any).rMultiple ?? null,
    status: row.status,
    tags,
    timeframe: (row as any).timeframe ?? null,
    session: deriveSession(entryDateIso),
    setupQuality: (row as any).setupQuality ?? null,
    planRespected: (row as any).planRespected ?? null,
    stopMoved: (row as any).stopMoved ?? null,
    tpMoved: (row as any).tpMoved ?? null,
    errorType: (row as any).errorType ?? null,
    mistake: (row as any).mistake ?? null,
    lesson: (row as any).lesson ?? null,
    notes: row.notes,
    emotion: row.emotion,
    beforeImageUrl: row.beforeImageUrl,
    afterImageUrl: row.afterImageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}