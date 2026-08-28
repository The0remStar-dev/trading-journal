// filepath: src/app/api/trades/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
// ⚠️ Adaptez ce chemin si votre client Supabase serveur est exporté ailleurs.
import { createClient } from "@/lib/supabase/server";
import { detectBrokerProfile, type BrokerProfile } from "@/lib/import/brokerProfiles";

export const runtime = "nodejs"; // nécessaire pour Buffer / JSZip / xlsx

// --- Configuration du mapping de colonnes -----------------------------------

const HEADER_KEYWORDS = [
  "instrument",
  "symbol",
  "symbole",
  "ticker",
  "open time",
  "close time",
  "type",
  "side",
  "sens",
  "direction",
  "profit",
  "pnl",
  "p/l",
];

const COLUMN_ALIASES: Record<string, string[]> = {
  symbol: ["instrument", "symbol", "symbole", "ticker"],
  direction: ["type", "side", "sens", "direction"],
  entryDate: [
    "open time",
    "opentime",
    "date ouverture",
    "date d'ouverture",
    "heure d'ouverture",
    "entry date",
    "open date",
  ],
  exitDate: [
    "close time",
    "closetime",
    "date cloture",
    "date de clôture",
    "heure de clôture",
    "exit date",
    "close date",
  ],
  entryPrice: ["open price", "price open", "prix ouverture", "prix d'ouverture", "entry price"],
  exitPrice: ["close price", "price close", "prix cloture", "prix de clôture", "exit price"],
  positionSize: ["volume", "size", "lots", "quantity", "quantité"],
  pnl: ["profit", "pnl", "p/l", "net profit", "gain/perte"],
  fees: ["commission", "swap", "fees", "frais"],
  comment: ["comment", "commentaire"],
};

interface ColumnMap {
  symbol?: number;
  direction?: number;
  entryDate?: number;
  exitDate?: number;
  entryPrice?: number;
  exitPrice?: number;
  positionSize?: number;
  pnl?: number;
  feesIndices: number[];
  comment?: number;
}

/** Raisons possibles de la détermination du volume, exposées pour audit/preview. */
type PositionSizeSource = "derived_from_pnl" | "broker_profile" | "raw" | "fallback_default";

// --- Utilitaires de parsing --------------------------------------------------

function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== "");

  for (const line of lines) {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

function extractRowsFromCsv(text: string): unknown[][] {
  const firstLine = text.split(/\r\n|\n|\r/)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  return parseCsv(text, delimiter);
}

function extractRowsFromExcel(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
}

async function extractRowsFromZip(buffer: Buffer): Promise<unknown[][]> {
  const zip = await JSZip.loadAsync(buffer);

  const candidate = Object.values(zip.files).find((entry) => {
    if (entry.dir) return false;
    const name = entry.name;
    if (name.includes("__MACOSX/")) return false;
    const baseName = name.split("/").pop() ?? "";
    if (baseName.startsWith("._")) return false;
    return /\.(xlsx|xls|csv)$/i.test(name);
  });

  if (!candidate) return [];

  if (candidate.name.toLowerCase().endsWith(".csv")) {
    const text = await candidate.async("string");
    return extractRowsFromCsv(text);
  }

  const fileBuffer = Buffer.from(await candidate.async("arraybuffer"));
  return extractRowsFromExcel(fileBuffer);
}

function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  const fractionalDay = serial - Math.floor(serial) + 1e-7;
  let totalSeconds = Math.floor(86400 * fractionalDay);
  const seconds = totalSeconds % 60;
  totalSeconds -= seconds;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate(), hours, minutes, seconds);
}

function parseFlexibleDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "number") return excelSerialToDate(value);

  const str = String(value).trim();

  const mt4Match = str.match(/^(\d{4})\.(\d{2})\.(\d{2})[ T](\d{2}):(\d{2})(:(\d{2}))?/);
  if (mt4Match) {
    const [, y, mo, d, h, mi, , s] = mt4Match;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0));
  }

  const euMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T]?(\d{2})?:?(\d{2})?:?(\d{2})?/);
  if (euMatch) {
    const [, d, mo, y, h, mi, s] = euMatch;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h || 0), Number(mi || 0), Number(s || 0));
  }

  const native = new Date(str);
  return isNaN(native.getTime()) ? null : native;
}

function parseFlexibleNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeDirection(value: unknown): "LONG" | "SHORT" {
  const str = String(value ?? "").trim().toLowerCase();
  if (["sell", "short", "vente", "s", "1"].includes(str)) return "SHORT";
  return "LONG";
}

function findHeaderRow(rows: unknown[][]): { headerIndex: number; columnMap: ColumnMap; headerCells: string[] } | null {
  const searchLimit = Math.min(rows.length, 15);

  for (let i = 0; i < searchLimit; i++) {
    const cells = rows[i].map((c) => String(c ?? "").toLowerCase().trim());
    const matchCount = HEADER_KEYWORDS.filter((kw) => cells.some((c) => c.includes(kw))).length;

    if (matchCount >= 2) {
      const columnMap = buildColumnMap(cells);
      return { headerIndex: i, columnMap, headerCells: cells };
    }
  }
  return null;
}

function buildColumnMap(headerCells: string[]): ColumnMap {
  const map: ColumnMap = { feesIndices: [] };

  headerCells.forEach((cell, index) => {
    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
      const matches = aliases.some((alias) => cell === alias || cell.includes(alias));
      if (!matches) continue;

      if (key === "fees") {
        map.feesIndices.push(index);
      } else if (map[key as keyof ColumnMap] === undefined) {
        (map as any)[key] = index;
      }
    }
  });

  return map;
}

function buildSignature(symbol: string, entryDate: Date, pnl: number): string {
  return `${symbol}_${entryDate.getTime()}_${pnl.toFixed(2)}`;
}

/**
 * Détermine la taille de position réelle avec la stratégie la plus fiable
 * disponible, dans cet ordre de priorité :
 *
 * 1. DÉRIVATION DEPUIS LE PNL DU BROKER (le plus robuste, universel) :
 *    positionSize = pnl_broker / écart_de_prix. Comme le PnL broker est
 *    conservé tel quel (jamais recalculé), le montant affiché dans l'app
 *    est mathématiquement garanti identique au broker, quelle que soit
 *    l'unité de volume utilisée par ce dernier.
 *
 * 2. PROFIL BROKER CONNU (fallback) : utilisé seulement si le PnL est absent
 *    (trade encore ouvert) et qu'un profil a été détecté via la signature
 *    d'en-tête (jamais via un seuil de valeur arbitraire).
 *
 * 3. VALEUR BRUTE : broker inconnu et pas de PnL disponible — la valeur est
 *    conservée telle quelle et signalée pour vérification manuelle côté UI.
 */
function resolvePositionSize(params: {
  rawPositionSize: number;
  entryPrice: number;
  exitPrice: number | null;
  pnlFromFile: number | null;
  direction: "LONG" | "SHORT";
  fees: number;
  brokerProfile: BrokerProfile | null;
}): { positionSize: number; source: PositionSizeSource } {
  const { rawPositionSize, entryPrice, exitPrice, pnlFromFile, direction, fees, brokerProfile } = params;

  if (exitPrice !== null && pnlFromFile !== null) {
    const rawDiff = direction === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
    // On ajoute les frais au PnL avant division car pnl_broker = rawDiff * size - fees.
    const priceMove = rawDiff;
    if (Math.abs(priceMove) > 1e-9) {
      const derivedSize = (pnlFromFile + fees) / priceMove;
      // Une taille dérivée négative ou nulle indique une incohérence (ex: mauvaise
      // colonne de direction) — dans ce cas on retombe sur les couches suivantes
      // plutôt que d'enregistrer une valeur clairement fausse.
      if (derivedSize > 0 && Number.isFinite(derivedSize)) {
        return { positionSize: Number(derivedSize.toFixed(6)), source: "derived_from_pnl" };
      }
    }
  }

  if (brokerProfile && brokerProfile.lotSizeMultiplier !== 1) {
    return {
      positionSize: Number((rawPositionSize * brokerProfile.lotSizeMultiplier).toFixed(6)),
      source: "broker_profile",
    };
  }

  return { positionSize: rawPositionSize || 1, source: rawPositionSize ? "raw" : "fallback_default" };
}

function normalizeRow(row: unknown[], columnMap: ColumnMap, brokerProfile: BrokerProfile | null) {
  const get = (idx?: number) => (idx !== undefined ? row[idx] : undefined);

  const symbolRaw = get(columnMap.symbol);
  const entryDateRaw = get(columnMap.entryDate);
  if (!symbolRaw || !entryDateRaw) return null;

  const symbol = String(symbolRaw).trim().toUpperCase();
  const entryDate = parseFlexibleDate(entryDateRaw);
  if (!symbol || !entryDate) return null;

  const exitDate = parseFlexibleDate(get(columnMap.exitDate));
  const entryPrice = parseFlexibleNumber(get(columnMap.entryPrice));
  const exitPrice = columnMap.exitPrice !== undefined ? parseFlexibleNumber(get(columnMap.exitPrice)) : null;
  const rawPositionSize = parseFlexibleNumber(get(columnMap.positionSize));
  const fees = columnMap.feesIndices.reduce((sum, idx) => sum + Math.abs(parseFlexibleNumber(row[idx])), 0);
  const direction = normalizeDirection(get(columnMap.direction));

  // Le PnL du broker est la vérité terrain : on ne le recalcule JAMAIS quand il existe.
  const pnlFromFile = columnMap.pnl !== undefined ? parseFlexibleNumber(get(columnMap.pnl)) : null;

  const { positionSize, source } = resolvePositionSize({
    rawPositionSize,
    entryPrice,
    exitPrice,
    pnlFromFile,
    direction,
    fees,
    brokerProfile,
  });

  // pnl final : broker si disponible, sinon calcul de secours avec le volume résolu.
  let pnl = pnlFromFile ?? 0;
  if (pnlFromFile === null && exitPrice !== null) {
    const rawDiff = direction === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
    pnl = rawDiff * positionSize - fees;
  }

  const notional = entryPrice * positionSize;
  const pnlPercentage = notional ? (pnl / notional) * 100 : 0;

  const status: "WIN" | "LOSS" | "BREAKEVEN" | "OPEN" =
    exitPrice === null ? "OPEN" : Math.abs(pnl) < 0.005 ? "BREAKEVEN" : pnl > 0 ? "WIN" : "LOSS";

  const comment = columnMap.comment !== undefined ? String(get(columnMap.comment) ?? "").trim() : "";

  return {
    accountType: "LIVE" as const,
    symbol,
    direction,
    entryDate,
    exitDate,
    entryPrice,
    exitPrice,
    positionSize,
    fees,
    pnl,
    pnlPercentage,
    riskRewardRatio: null,
    status,
    tags: JSON.stringify([]), // laissé vide : saisie manuelle par l'utilisateur
    notes: comment || null,
    beforeImageUrl: null,
    afterImageUrl: null,
    // Métadonnée d'audit, retirée avant écriture en base (voir plus bas) mais
    // renvoyée dans la réponse pour permettre un écran de vérification côté UI.
    _positionSizeSource: source,
  };
}

// --- Handler principal --------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Authentification via Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let rows: unknown[][];
    if (filename.endsWith(".zip")) {
      rows = await extractRowsFromZip(buffer);
    } else if (filename.endsWith(".csv")) {
      rows = extractRowsFromCsv(buffer.toString("utf-8"));
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      rows = extractRowsFromExcel(buffer);
    } else {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez .csv, .xlsx, .xls ou .zip." },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Impossible de lire le contenu du fichier." }, { status: 400 });
    }

    const headerInfo = findHeaderRow(rows);
    if (!headerInfo || headerInfo.columnMap.symbol === undefined || headerInfo.columnMap.entryDate === undefined) {
      return NextResponse.json(
        { error: "Impossible de détecter les colonnes de trading (symbole / date d'ouverture) dans ce fichier." },
        { status: 400 }
      );
    }

    // Détection du broker via signature d'en-tête, utilisée uniquement en
    // fallback pour les trades sans PnL (voir resolvePositionSize).
    const brokerProfile = detectBrokerProfile(headerInfo.headerCells);

    const dataRows = rows.slice(headerInfo.headerIndex + 1);
    const parsedTrades = dataRows
      .map((row) => normalizeRow(row, headerInfo.columnMap, brokerProfile))
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (parsedTrades.length === 0) {
      return NextResponse.json({ error: "Aucun trade valide trouvé dans le fichier." }, { status: 400 });
    }

    const existingTrades = await prisma.trade.findMany({
      where: { userId: user.id },
      select: { symbol: true, entryDate: true, pnl: true },
    });
    const knownSignatures = new Set(
      existingTrades.map((t) => buildSignature(t.symbol, t.entryDate, t.pnl))
    );

    const newTrades: any[] = [];
    let duplicateCount = 0;
    // Trades dont la taille de position n'a pu être ni dérivée du PnL ni
    // résolue via un profil broker connu — à faire vérifier par l'utilisateur.
    const flaggedForReview: { symbol: string; entryDate: string; positionSize: number }[] = [];

    for (const trade of parsedTrades) {
      const { _positionSizeSource, ...cleanTrade } = trade;

      const signature = buildSignature(cleanTrade.symbol, cleanTrade.entryDate, cleanTrade.pnl);
      if (knownSignatures.has(signature)) {
        duplicateCount++;
        continue;
      }
      knownSignatures.add(signature);

      if (_positionSizeSource === "raw" || _positionSizeSource === "fallback_default") {
        flaggedForReview.push({
          symbol: cleanTrade.symbol,
          entryDate: cleanTrade.entryDate.toISOString(),
          positionSize: cleanTrade.positionSize,
        });
      }

      newTrades.push({ ...cleanTrade, userId: user.id });
    }

    if (newTrades.length > 0) {
      await prisma.trade.createMany({ data: newTrades });
    }

    return NextResponse.json({
      success: true,
      imported: newTrades.length,
      duplicates: duplicateCount,
      total: parsedTrades.length,
      brokerDetected: brokerProfile?.label ?? "Non identifié (générique)",
      // Permet au front d'afficher un avertissement ciblé sans bloquer l'import.
      needsReview: flaggedForReview,
    });
  } catch (err) {
    console.error("Erreur lors de l'import des trades :", err);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du traitement du fichier." },
      { status: 500 }
    );
  }
}