import * as XLSX from "xlsx";
import JSZip from "jszip";
import { detectBrokerProfile, type BrokerProfile } from "@/lib/import/brokerProfiles";

const HEADER_KEYWORDS = [
  "instrument", "symbol", "symbole", "ticker",
  "open time", "close time", "type", "side", "sens", "direction",
  "profit", "pnl", "p/l",
];

const COLUMN_ALIASES: Record<string, string[]> = {
  symbol: ["instrument", "symbol", "symbole", "ticker"],
  direction: ["type", "side", "sens", "direction"],
  entryDate: ["open time", "opentime", "date ouverture", "date d'ouverture", "heure d'ouverture", "entry date", "open date"],
  exitDate: ["close time", "closetime", "date cloture", "date de clôture", "heure de clôture", "exit date", "close date"],
  entryPrice: ["open price", "price open", "prix ouverture", "prix d'ouverture", "entry price"],
  exitPrice: ["close price", "price close", "prix cloture", "prix de clôture", "exit price"],
  stopLoss: ["s/l", "stop loss", "stop"],
  takeProfit: ["t/p", "take profit"],
  positionSize: ["volume", "size", "lots", "quantity", "quantité"],
  pnl: ["profit", "pnl", "p/l", "net profit", "gain/perte"],
  fees: ["commission", "swap", "fees", "frais"],
  comment: ["comment", "commentaire"],
};

const LOT_SIZE_SCALE_THRESHOLD = 0.01;
const LOT_SIZE_SCALE_FACTOR = 100;

interface ColumnMap {
  symbol?: number; direction?: number; entryDate?: number; exitDate?: number;
  entryPrice?: number; exitPrice?: number; stopLoss?: number; takeProfit?: number;
  positionSize?: number; pnl?: number; feesIndices: number[]; comment?: number;
}

export interface ParsedTradeRow {
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
  pnlFromFile: number | null;
  positionSizeSource: "derived_from_pnl" | "broker_profile" | "raw" | "fallback_default";
}

export type RowParseResult =
  | { rowNumber: number; status: "parsed"; data: ParsedTradeRow }
  | { rowNumber: number; status: "error"; reason: string };

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
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) { cells.push(current.trim()); current = ""; }
      else current += char;
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

function extractRowsFromCsv(text: string): unknown[][] {
  const firstLine = text.split(/\r\n|\n|\r/)[0] ?? "";
  return parseCsv(text, detectDelimiter(firstLine));
}

function extractRowsFromExcel(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
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
    return extractRowsFromCsv(await candidate.async("string"));
  }
  return extractRowsFromExcel(Buffer.from(await candidate.async("arraybuffer")));
}

function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const dateInfo = new Date(utcDays * 86400 * 1000);
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
  return ["sell", "short", "vente", "s", "1"].includes(str) ? "SHORT" : "LONG";
}

function findHeaderRow(rows: unknown[][]): { headerIndex: number; columnMap: ColumnMap; headerCells: string[] } | null {
  const searchLimit = Math.min(rows.length, 15);
  for (let i = 0; i < searchLimit; i++) {
    const cells = rows[i].map((c) => String(c ?? "").toLowerCase().trim());
    const matchCount = HEADER_KEYWORDS.filter((kw) => cells.some((c) => c.includes(kw))).length;
    if (matchCount >= 2) return { headerIndex: i, columnMap: buildColumnMap(cells), headerCells: cells };
  }
  return null;
}

function buildColumnMap(headerCells: string[]): ColumnMap {
  const map: ColumnMap = { feesIndices: [] };
  headerCells.forEach((cell, index) => {
    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (!aliases.some((alias) => cell === alias || cell.includes(alias))) continue;
      if (key === "fees") map.feesIndices.push(index);
      else if (map[key as keyof ColumnMap] === undefined) (map as any)[key] = index;
    }
  });
  return map;
}

export function buildSignature(symbol: string, entryDate: Date, pnl: number): string {
  return `${symbol}_${entryDate.getTime()}_${pnl.toFixed(2)}`;
}

function normalizeLotSize(rawValue: number): number {
  if (rawValue > 0 && rawValue < LOT_SIZE_SCALE_THRESHOLD) {
    return Number((rawValue * LOT_SIZE_SCALE_FACTOR).toFixed(4));
  }
  return rawValue;
}

function resolvePositionSize(params: {
  rawPositionSize: number; entryPrice: number; exitPrice: number | null;
  pnlFromFile: number | null; direction: "LONG" | "SHORT"; fees: number;
  brokerProfile: BrokerProfile | null;
}): { positionSize: number; source: ParsedTradeRow["positionSizeSource"] } {
  const { rawPositionSize, entryPrice, exitPrice, pnlFromFile, direction, fees, brokerProfile } = params;

  if (exitPrice !== null && pnlFromFile !== null) {
    const priceMove = direction === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
    if (Math.abs(priceMove) > 1e-9) {
      const derivedSize = (pnlFromFile + fees) / priceMove;
      if (derivedSize > 0 && Number.isFinite(derivedSize)) {
        return { positionSize: Number(derivedSize.toFixed(6)), source: "derived_from_pnl" };
      }
    }
  }
  if (brokerProfile && brokerProfile.lotSizeMultiplier !== 1) {
    return { positionSize: Number((rawPositionSize * brokerProfile.lotSizeMultiplier).toFixed(6)), source: "broker_profile" };
  }
  const normalized = normalizeLotSize(rawPositionSize);
  return { positionSize: normalized || 1, source: rawPositionSize ? "raw" : "fallback_default" };
}

function normalizeRow(
  row: unknown[],
  rowNumber: number,
  columnMap: ColumnMap,
  brokerProfile: BrokerProfile | null
): RowParseResult {
  const get = (idx?: number) => (idx !== undefined ? row[idx] : undefined);

  const symbolRaw = get(columnMap.symbol);
  const entryDateRaw = get(columnMap.entryDate);
  if (!symbolRaw || !entryDateRaw) {
    return { rowNumber, status: "error", reason: "Symbole ou date d'entrée manquant sur cette ligne." };
  }

  const symbol = String(symbolRaw).trim().toUpperCase();
  const entryDate = parseFlexibleDate(entryDateRaw);
  if (!symbol || !entryDate) {
    return { rowNumber, status: "error", reason: "Impossible de lire la date d'entrée sur cette ligne." };
  }

  const exitDate = parseFlexibleDate(get(columnMap.exitDate));
  const entryPrice = parseFlexibleNumber(get(columnMap.entryPrice));
  if (entryPrice <= 0) {
    return { rowNumber, status: "error", reason: "Prix d'entrée manquant ou invalide." };
  }
  const exitPrice = columnMap.exitPrice !== undefined ? parseFlexibleNumber(get(columnMap.exitPrice)) : null;
  const stopLoss = columnMap.stopLoss !== undefined ? parseFlexibleNumber(get(columnMap.stopLoss)) || null : null;
  const takeProfit = columnMap.takeProfit !== undefined ? parseFlexibleNumber(get(columnMap.takeProfit)) || null : null;

  const rawPositionSize = parseFlexibleNumber(get(columnMap.positionSize));
  const fees = columnMap.feesIndices.reduce((sum, idx) => sum + Math.abs(parseFlexibleNumber(row[idx])), 0);
  const direction = normalizeDirection(get(columnMap.direction));
  const pnlFromFile = columnMap.pnl !== undefined ? parseFlexibleNumber(get(columnMap.pnl)) : null;

  const { positionSize, source } = resolvePositionSize({
    rawPositionSize, entryPrice, exitPrice, pnlFromFile, direction, fees, brokerProfile,
  });

  return {
    rowNumber,
    status: "parsed",
    data: {
      symbol, direction, entryDate: entryDate.toISOString(), exitDate: exitDate ? exitDate.toISOString() : null,
      entryPrice, exitPrice, stopLoss, takeProfit, positionSize, fees, pnlFromFile, positionSizeSource: source,
    },
  };
}

export async function parseTradeFileBuffer(
  buffer: Buffer,
  filename: string
): Promise<{ rows: RowParseResult[]; brokerLabel: string } | { error: string }> {
  const lower = filename.toLowerCase();
  let rows: unknown[][];

  if (lower.endsWith(".zip")) rows = await extractRowsFromZip(buffer);
  else if (lower.endsWith(".csv")) rows = extractRowsFromCsv(buffer.toString("utf-8"));
  else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) rows = extractRowsFromExcel(buffer);
  else return { error: "Format non supporté. Utilisez .csv, .xlsx, .xls ou .zip." };

  if (rows.length === 0) return { error: "Impossible de lire le contenu du fichier." };

  const headerInfo = findHeaderRow(rows);
  if (
    headerInfo &&
    headerInfo.headerCells.some((cell) => cell.includes("heure de placement")) &&
    headerInfo.headerCells.some((cell) => cell.includes("prix de remplissage")) &&
    headerInfo.headerCells.some((cell) => cell.includes("statut"))
  ) {
    return {
      error:
        "Ce fichier TradingView contient l'historique des ordres, pas des trades. Les ordres annulés ou non exécutés ne peuvent pas être importés. Utilisez un export de trades contenant les prix et dates d'entrée et de sortie.",
    };
  }

  if (!headerInfo || headerInfo.columnMap.symbol === undefined || headerInfo.columnMap.entryDate === undefined) {
    return { error: "Impossible de détecter les colonnes de trading (symbole / date d'ouverture)." };
  }

  const brokerProfile = detectBrokerProfile(headerInfo.headerCells);
  const dataRows = rows.slice(headerInfo.headerIndex + 1);

  const results = dataRows.map((row, i) =>
    normalizeRow(row, headerInfo.headerIndex + i + 2, headerInfo.columnMap, brokerProfile)
  );

  return { rows: results, brokerLabel: brokerProfile?.label ?? "Générique" };
}