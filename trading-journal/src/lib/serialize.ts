import type { Trade as PrismaTrade } from "@prisma/client";
import type { Trade } from "@/types/trade";

/**
 * Converts a raw Prisma Trade row (tags stored as JSON string, Dates as Date objects)
 * into the client-facing Trade shape (tags as string[], dates as ISO strings).
 */
export function serializeTrade(row: PrismaTrade): Trade {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags);
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    accountType: row.accountType,
    symbol: row.symbol,
    direction: row.direction,
    entryDate: row.entryDate.toISOString(),
    exitDate: row.exitDate ? row.exitDate.toISOString() : null,
    entryPrice: row.entryPrice,
    exitPrice: row.exitPrice,
    positionSize: row.positionSize,
    fees: row.fees,
    pnl: row.pnl,
    pnlPercentage: row.pnlPercentage,
    riskRewardRatio: row.riskRewardRatio,
    status: row.status,
    tags,
    notes: row.notes,
    beforeImageUrl: row.beforeImageUrl,
    afterImageUrl: row.afterImageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
