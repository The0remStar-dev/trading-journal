import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { calculatePnl, calculatePnlPercentage, deriveStatus } from "@/lib/calculations";
import { computeRiskAmount, computeTradeRiskAmount, tradeToR } from "@/lib/rMultiple";
import { buildSignature } from "@/lib/import/tradeFileParser";
import { validateTradeInput } from "@/lib/validation/tradeValidation";

export const runtime = "nodejs";

interface ConfirmRow {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSize: number;
  fees: number;
}

// POST /api/trades/import/confirm — insère réellement les trades approuvés
// par l'utilisateur après la preview. Recalcule pnl/statut/risque/R
// côté serveur pour chaque ligne (jamais de confiance dans un calcul déjà
// fait côté client) et revalide/re-vérifie les doublons (protection contre
// une course entre preview et confirm).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as { trades: ConfirmRow[] };
  if (!Array.isArray(body.trades) || body.trades.length === 0) {
    return NextResponse.json({ error: "Aucun trade à importer." }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  const fallbackRiskAmount = computeRiskAmount({
    initialCapital: profile?.initialCapital ?? null,
    riskPerTradePercent: profile?.riskPerTradePercent ?? null,
  });

  const existingTrades = await prisma.trade.findMany({
    where: { userId: user.id },
    select: { symbol: true, entryDate: true, pnl: true },
  });
  const knownSignatures = new Set(existingTrades.map((t) => buildSignature(t.symbol, t.entryDate, t.pnl)));

  const toInsert: any[] = [];
  const errors: { index: number; reason: string }[] = [];
  let skipped = 0;

  body.trades.forEach((raw, index) => {
    const validationErrors = validateTradeInput({
      symbol: raw.symbol,
      direction: raw.direction,
      entryDate: raw.entryDate,
      entryPrice: raw.entryPrice,
      exitPrice: raw.exitPrice,
      stopLoss: raw.stopLoss,
      takeProfit: raw.takeProfit,
      positionSize: raw.positionSize,
      fees: raw.fees,
    } as any);

    if (validationErrors.length > 0) {
      errors.push({ index, reason: validationErrors.map((e) => e.message).join(" ") });
      return;
    }

    const pnl = calculatePnl({
      direction: raw.direction, entryPrice: raw.entryPrice, exitPrice: raw.exitPrice,
      positionSize: raw.positionSize, fees: raw.fees ?? 0,
    });
    const pnlPercentage = calculatePnlPercentage({
      direction: raw.direction, entryPrice: raw.entryPrice, exitPrice: raw.exitPrice,
      positionSize: raw.positionSize, fees: raw.fees ?? 0,
    });
    const status = deriveStatus({ exitPrice: raw.exitPrice, pnl });

    const signature = buildSignature(raw.symbol.toUpperCase(), new Date(raw.entryDate), pnl);
    if (knownSignatures.has(signature)) {
      skipped++;
      return;
    }
    knownSignatures.add(signature);

    const { riskAmount } = computeTradeRiskAmount({
      entryPrice: raw.entryPrice, stopLoss: raw.stopLoss ?? null,
      positionSize: raw.positionSize, fallbackRiskAmount,
    });
    const rMultiple = tradeToR(pnl, status === "OPEN", riskAmount);

    toInsert.push({
      userId: user.id,
      accountType: "LIVE",
      symbol: raw.symbol.toUpperCase(),
      direction: raw.direction,
      entryDate: new Date(raw.entryDate),
      exitDate: raw.exitDate ? new Date(raw.exitDate) : null,
      entryPrice: raw.entryPrice,
      exitPrice: raw.exitPrice ?? null,
      stopLoss: raw.stopLoss ?? null,
      takeProfit: raw.takeProfit ?? null,
      positionSize: raw.positionSize,
      fees: raw.fees ?? 0,
      pnl,
      pnlPercentage,
      riskAmount,
      rMultiple,
      status,
      tags: JSON.stringify([]),
      notes: null,
      emotion: null,
      mistake: null,
      lesson: null,
      beforeImageUrl: null,
      afterImageUrl: null,
    });
  });

  if (toInsert.length > 0) {
    await prisma.trade.createMany({ data: toInsert });
  }

  return NextResponse.json({
    imported: toInsert.length,
    skipped,
    errors,
    total: body.trades.length,
  });
}