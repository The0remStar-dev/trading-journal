import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTrade } from "@/lib/serialize";
import { calculatePnl, calculatePnlPercentage, deriveStatus } from "@/lib/calculations";
import { computeRiskAmount, computeTradeRiskAmount, tradeToR } from "@/lib/rMultiple";
import { validateTradeInput } from "@/lib/validation/tradeValidation";
import { createClient } from "@/lib/supabase/server";
import type { TradeInput } from "@/types/trade";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/trades/:id
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const trade = await prisma.trade.findFirst({ where: { id, userId: user.id } });

  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  return NextResponse.json({ trade: serializeTrade(trade) });
}

// PUT /api/trades/:id — full update, avec validation et recalcul risque/R
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const existing = await prisma.trade.findFirst({ where: { id, userId: user.id } });

  if (!existing) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const body = (await request.json()) as TradeInput;

  const validationErrors = validateTradeInput(body);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Données de trade invalides.", details: validationErrors },
      { status: 400 }
    );
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

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  const fallbackRiskAmount = computeRiskAmount({
    initialCapital: profile?.initialCapital ?? null,
    riskPerTradePercent: profile?.riskPerTradePercent ?? null,
  });

  const { riskAmount } = computeTradeRiskAmount({
    entryPrice: body.entryPrice,
    stopLoss: body.stopLoss ?? null,
    positionSize: body.positionSize,
    fallbackRiskAmount,
  });

  const rMultiple = tradeToR(pnl, status === "OPEN", riskAmount);

  try {
    const updated = await prisma.trade.update({
      where: { id },
      data: {
        accountType: body.accountType,
        symbol: body.symbol.toUpperCase(),
        direction: body.direction,
        entryDate: new Date(body.entryDate),
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        entryPrice: body.entryPrice,
        exitPrice: body.exitPrice ?? null,
        stopLoss: body.stopLoss ?? null,
        takeProfit: body.takeProfit ?? null,
        positionSize: body.positionSize,
        fees: body.fees ?? 0,
        pnl,
        pnlPercentage,
        riskRewardRatio: body.riskRewardRatio ?? null,
        riskAmount,
        rMultiple,
        status,
        tags: JSON.stringify(body.tags ?? []),
        timeframe: body.timeframe ?? null,
        setupQuality: body.setupQuality ?? null,
        planRespected: body.planRespected ?? null,
        stopMoved: body.stopMoved ?? false,
        tpMoved: body.tpMoved ?? false,
        errorType: body.errorType ?? null,
        mistake: body.mistake ?? null,
        lesson: body.lesson ?? null,
        notes: body.notes ?? null,
        emotion: body.emotion ?? null,
        beforeImageUrl: body.beforeImageUrl ?? null,
        afterImageUrl: body.afterImageUrl ?? null,
      },
    });

    return NextResponse.json({ trade: serializeTrade(updated) });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du trade :", err);
    return NextResponse.json({ error: "Impossible de mettre à jour le trade." }, { status: 500 });
  }
}

// DELETE /api/trades/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const existing = await prisma.trade.findFirst({ where: { id, userId: user.id } });

  if (!existing) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  await prisma.trade.delete({ where: { id } });

  return NextResponse.json({ success: true });
}