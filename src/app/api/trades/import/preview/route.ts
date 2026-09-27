import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { parseTradeFileBuffer, buildSignature } from "@/lib/import/tradeFileParser";
import { calculatePnl } from "@/lib/calculations";

export const runtime = "nodejs";

// POST /api/trades/import/preview — parse et valide le fichier SANS écrire
// en base. Chaque ligne ressort avec un statut explicite (valid / duplicate /
// error) : aucune ligne n'est silencieusement ignorée.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parseResult = await parseTradeFileBuffer(buffer, file.name);
  if ("error" in parseResult) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 });
  }

  const existingTrades = await prisma.trade.findMany({
    where: { userId: user.id },
    select: { symbol: true, entryDate: true, pnl: true },
  });
  const knownSignatures = new Set(existingTrades.map((t) => buildSignature(t.symbol, t.entryDate, t.pnl)));

  const rows = parseResult.rows.map((r) => {
    if (r.status === "error") {
      return { rowNumber: r.rowNumber, status: "error" as const, reason: r.reason };
    }

    const data = r.data;
    const provisionalPnl =
      data.pnlFromFile ??
      calculatePnl({
        direction: data.direction,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice,
        positionSize: data.positionSize,
        fees: data.fees,
      });

    const signature = buildSignature(data.symbol, new Date(data.entryDate), provisionalPnl);
    if (knownSignatures.has(signature)) {
      return {
        rowNumber: r.rowNumber,
        status: "duplicate" as const,
        reason: "Ce trade semble déjà présent dans votre journal.",
        trade: data,
      };
    }
    knownSignatures.add(signature); // évite aussi les doublons internes au fichier
    return { rowNumber: r.rowNumber, status: "valid" as const, trade: data };
  });

  const summary = {
    totalRows: rows.length,
    valid: rows.filter((r) => r.status === "valid").length,
    duplicates: rows.filter((r) => r.status === "duplicate").length,
    errors: rows.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ rows, summary, brokerLabel: parseResult.brokerLabel });
}