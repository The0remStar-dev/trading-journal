import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
// ⚠️ Adaptez ce chemin si votre client Supabase serveur est exporté ailleurs.
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // nécessaire pour Buffer / JSZip / xlsx

// --- Configuration du mapping de colonnes -----------------------------------

// Mots-clés utilisés pour détecter automatiquement la ligne d'en-tête,
// quelle que soit la position réelle des données dans le fichier.
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

// Alias acceptés pour chaque colonne, en anglais et en français
// (couvre notamment les exports XTB / MT4 / MT5 courants en Europe).
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

// --- Utilitaires de parsing --------------------------------------------------

/** Détecte le séparateur CSV (virgule ou point-virgule) via la première ligne. */
function detectDelimiter(firstLine: string): string {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

/** Parseur CSV minimaliste, gère les champs entourés de guillemets. */
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
  // cellDates: true permet à xlsx de convertir les cellules formatées "date"
  // directement en objets Date JS plutôt qu'en numéros de série Excel.
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
}

async function extractRowsFromZip(buffer: Buffer): Promise<unknown[][]> {
  const zip = await JSZip.loadAsync(buffer);

  // On cherche le premier fichier de trading valide, en ignorant
  // les dossiers système macOS (__MACOSX/) et les fichiers cachés (._*).
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

/** Convertit un numéro de série Excel en date JS. */
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

/** Parse une date quel que soit son format d'origine (Excel, MT4/XTB, ISO, EU...). */
function parseFlexibleDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "number") return excelSerialToDate(value);

  const str = String(value).trim();

  // Format MT4 / XTB : "2024.01.15 10:23:00"
  const mt4Match = str.match(/^(\d{4})\.(\d{2})\.(\d{2})[ T](\d{2}):(\d{2})(:(\d{2}))?/);
  if (mt4Match) {
    const [, y, mo, d, h, mi, , s] = mt4Match;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0));
  }

  // Format européen : "15/01/2024 10:23:00"
  const euMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T]?(\d{2})?:?(\d{2})?:?(\d{2})?/);
  if (euMatch) {
    const [, d, mo, y, h, mi, s] = euMatch;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h || 0), Number(mi || 0), Number(s || 0));
  }

  const native = new Date(str);
  return isNaN(native.getTime()) ? null : native;
}

/** Parse un nombre en gérant les virgules décimales (formats européens). */
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
  return "LONG"; // buy / long / achat / b / 0 par défaut
}

/** Recherche la ligne d'en-tête parmi les 15 premières lignes du fichier. */
function findHeaderRow(rows: unknown[][]): { headerIndex: number; columnMap: ColumnMap } | null {
  const searchLimit = Math.min(rows.length, 15);

  for (let i = 0; i < searchLimit; i++) {
    const cells = rows[i].map((c) => String(c ?? "").toLowerCase().trim());
    const matchCount = HEADER_KEYWORDS.filter((kw) => cells.some((c) => c.includes(kw))).length;

    if (matchCount >= 2) {
      const columnMap = buildColumnMap(cells);
      return { headerIndex: i, columnMap };
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

/** Signature unique d'un trade, utilisée pour la détection de doublons. */
function buildSignature(symbol: string, entryDate: Date, pnl: number): string {
  return `${symbol}_${entryDate.getTime()}_${pnl.toFixed(2)}`;
}

/** Transforme une ligne brute en objet Trade normalisé, ou null si invalide. */
function normalizeRow(row: unknown[], columnMap: ColumnMap) {
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
  const positionSize = parseFlexibleNumber(get(columnMap.positionSize)) || 1;
  const fees = columnMap.feesIndices.reduce((sum, idx) => sum + Math.abs(parseFlexibleNumber(row[idx])), 0);
  const direction = normalizeDirection(get(columnMap.direction));

  // On privilégie le PnL fourni par le courtier ; sinon on le calcule nous-mêmes.
  let pnl = columnMap.pnl !== undefined ? parseFlexibleNumber(get(columnMap.pnl)) : 0;
  if (columnMap.pnl === undefined && exitPrice !== null) {
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
    tags: JSON.stringify(["Import"]),
    notes: comment || null,
    beforeImageUrl: null,
    afterImageUrl: null,
  };
}

// --- Handler principal --------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Authentification via Supabase
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await (await supabase).auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    // 2. Récupération du fichier depuis le FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Extraction des lignes brutes selon le format du fichier
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

    // 4. Détection dynamique de la ligne d'en-tête et du mapping des colonnes
    const headerInfo = findHeaderRow(rows);
    if (!headerInfo || headerInfo.columnMap.symbol === undefined || headerInfo.columnMap.entryDate === undefined) {
      return NextResponse.json(
        { error: "Impossible de détecter les colonnes de trading (symbole / date d'ouverture) dans ce fichier." },
        { status: 400 }
      );
    }

    // 5. Normalisation de chaque ligne de données
    const dataRows = rows.slice(headerInfo.headerIndex + 1);
    const parsedTrades = dataRows
      .map((row) => normalizeRow(row, headerInfo.columnMap))
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (parsedTrades.length === 0) {
      return NextResponse.json({ error: "Aucun trade valide trouvé dans le fichier." }, { status: 400 });
    }

    // 6. Anti-doublons : comparaison avec les trades déjà présents en base
    const existingTrades = await prisma.trade.findMany({
      where: { userId: user.id },
      select: { symbol: true, entryDate: true, pnl: true },
    });
    const knownSignatures = new Set(
      existingTrades.map((t) => buildSignature(t.symbol, t.entryDate, t.pnl))
    );

    const newTrades: (ReturnType<typeof normalizeRow> & { userId: string })[] = [];
    let duplicateCount = 0;

    for (const trade of parsedTrades) {
      const signature = buildSignature(trade.symbol, trade.entryDate, trade.pnl);
      if (knownSignatures.has(signature)) {
        duplicateCount++;
        continue;
      }
      knownSignatures.add(signature); // évite aussi les doublons internes au même fichier
      newTrades.push({ ...trade, userId: user.id });
    }

    // 7. Insertion en masse des nouveaux trades
    if (newTrades.length > 0) {
      await prisma.trade.createMany({ data: newTrades as any });
    }

    return NextResponse.json({
      success: true,
      imported: newTrades.length,
      duplicates: duplicateCount,
      total: parsedTrades.length,
    });
  } catch (err) {
    console.error("Erreur lors de l'import des trades :", err);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du traitement du fichier." },
      { status: 500 }
    );
  }
}