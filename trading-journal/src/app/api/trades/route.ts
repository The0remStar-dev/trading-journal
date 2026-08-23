import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTrade } from "@/lib/serialize";
import { calculatePnl, calculatePnlPercentage, deriveStatus } from "@/lib/calculations";
import type { TradeInput } from "@/types/trade";
import type { Prisma } from "@prisma/client";

// GET /api/trades — list trades with optional filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const where: Prisma.TradeWhereInput = {};

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    where.entryDate = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const symbol = searchParams.get("symbol");
  if (symbol) where.symbol = { contains: symbol.toUpperCase() };

  const direction = searchParams.get("direction");
  if (direction && direction !== "ALL") where.direction = direction as "LONG" | "SHORT";

  const status = searchParams.get("status");
  if (status && status !== "ALL") where.status = status as "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";

  const accountType = searchParams.get("accountType");
  if (accountType && accountType !== "ALL")
    where.accountType = accountType as "LIVE" | "BACKTEST" | "EVALUATION";

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { entryDate: "desc" },
  });

  let serialized = trades.map(serializeTrade);

  // Tag filtering happens in-memory since tags are stored as a JSON string column.
  const tagsParam = searchParams.get("tags");
  if (tagsParam) {
    const requestedTags = tagsParam.split(",").filter(Boolean);
    serialized = serialized.filter((t) => requestedTags.every((tag) => t.tags.includes(tag)));
  }

  return NextResponse.json({ trades: serialized });
}

// POST /api/trades — create a new trade, auto-computing PnL / PnL% / status
export async function POST(request: NextRequest) {
  const body = (await request.json()) as TradeInput;

  if (!body.symbol || !body.direction || !body.entryDate || body.entryPrice === undefined) {
    return NextResponse.json({ error: "Missing required trade fields." }, { status: 400 });
  }

  const pnl = calculatePnl({
    direction: body.direction,
    entryPrice: body.entryPrice,
    exitPrice: body.exitPrice,
    positionSize: body.positionSize,
    fees: body.fees ?? 0,
  });
  const pnlPercentage = calculatePnlPercentage({
    direction: body.direction,
    entryPrice: body.entryPrice,
    exitPrice: body.exitPrice,
    positionSize: body.positionSize,
    fees: body.fees ?? 0,
  });
  const status = deriveStatus({ exitPrice: body.exitPrice, pnl });

  const created = await prisma.trade.create({
    data: {
      accountType: body.accountType,
      symbol: body.symbol.toUpperCase(),
      direction: body.direction,
      entryDate: new Date(body.entryDate),
      exitDate: body.exitDate ? new Date(body.exitDate) : null,
      entryPrice: body.entryPrice,
      exitPrice: body.exitPrice ?? null,
      positionSize: body.positionSize,
      fees: body.fees ?? 0,
      pnl,
      pnlPercentage,
      riskRewardRatio: body.riskRewardRatio ?? null,
      status,
      tags: JSON.stringify(body.tags ?? []),
      notes: body.notes ?? null,
      beforeImageUrl: body.beforeImageUrl ?? null,
      afterImageUrl: body.afterImageUrl ?? null,
    },
  });

  return NextResponse.json({ trade: serializeTrade(created) }, { status: 201 });
}
