import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // 1. Lecture du fichier Excel / CSV
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(
      workbook.Sheets[sheetName]
    );

    if (!rawData.length) {
      return NextResponse.json(
        { error: "Le fichier est vide ou illisible" },
        { status: 400 }
      );
    }

    // 2. Récupération des trades existants pour l'anti-doublons
    const existingTrades = await prisma.trade.findMany({
      where: { userId: user.id },
      select: { symbol: true, entryDate: true, pnl: true },
    });

    // Empreinte unique d'un trade : SYMBOLE_TIMESTAMP_PNL
    const existingSignatures = new Set(
      existingTrades.map(
        (t) => `${t.symbol}_${new Date(t.entryDate).getTime()}_${Number(t.pnl)}`
      )
    );

    const tradesToInsert: any[] = [];
    let duplicateCount = 0;

    // 3. Normalisation des colonnes (XTB + CSV générique)
    for (const row of rawData) {
      const symbol = row["Symbol"] || row["Symbole"] || row["Ticker"] || row["Asset"];
      const typeRaw = row["Type"] || row["Side"] || row["Direction"] || "LONG";
      
      const openTime =
        row["Open time"] ||
        row["Open Time"] ||
        row["Date ouverture"] ||
        row["Entry Date"] ||
        row["Date"];
      
      const openPrice = parseFloat(
        row["Open price"] || row["Open Price"] || row["Prix ouverture"] || row["Entry Price"] || 0
      );
      
      const closePrice = parseFloat(
        row["Close price"] || row["Close Price"] || row["Prix fermeture"] || row["Exit Price"] || openPrice
      );

      const pnl = parseFloat(
        row["Profit"] || row["PnL"] || row["Gain/Perte"] || row["Net Profit"] || 0
      );

      if (!symbol || !openTime) continue;

      const type = String(typeRaw).toUpperCase().includes("BUY") || String(typeRaw).toUpperCase().includes("LONG")
        ? "LONG"
        : "SHORT";

      const entryDate = new Date(openTime);
      if (isNaN(entryDate.getTime())) continue;

      // Anti-doublon : création de la signature du trade courant
      const signature = `${String(symbol).toUpperCase()}_${entryDate.getTime()}_${pnl}`;

      if (existingSignatures.has(signature)) {
        duplicateCount++;
        continue; // Ignorer ce trade car il existe déjà
      }

      // Ajout de la signature pour éviter les doublons au sein du même fichier
      existingSignatures.add(signature);

      tradesToInsert.push({
        userId: user.id,
        symbol: String(symbol).toUpperCase(),
        type,
        entryDate,
        entryPrice: openPrice,
        exitPrice: closePrice,
        pnl,
        status: "CLOSED",
      });
    }

    if (tradesToInsert.length === 0) {
      return NextResponse.json({
        message: "Aucun nouveau trade à importer (tous ignorés ou déjà existants)",
        importedCount: 0,
        duplicateCount,
      });
    }

    // 4. Insertion en masse des nouveaux trades
    await prisma.trade.createMany({
      data: tradesToInsert,
    });

    return NextResponse.json({
      success: true,
      importedCount: tradesToInsert.length,
      duplicateCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur lors de l'importation : " + err.message },
      { status: 500 }
    );
  }
}