import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTrade } from "@/lib/serialize";
import { calculatePnl, calculatePnlPercentage, deriveStatus } from "@/lib/calculations";
import { createClient } from "@/lib/supabase/server";
import type { TradeInput } from "@/types/trade";

interface Params {
  params: { id: string };
}

// GET /api/trades/:id
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const trade = await prisma.trade.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  return NextResponse.json({ trade: serializeTrade(trade) });
}

// PUT /api/trades/:id — full update, recomputing PnL / status
export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const existing = await prisma.trade.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const body = (await request.json()) as TradeInput;

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

  const updated = await prisma.trade.update({
    where: { id: params.id },
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

  return NextResponse.json({ trade: serializeTrade(updated) });
}

// DELETE /api/trades/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const existing = await prisma.trade.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  await prisma.trade.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}