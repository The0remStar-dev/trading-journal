import type { TradeInput } from "@/types/trade";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Valide un payload de trade côté serveur, indépendamment de toute
 * validation HTML/frontend. Utilisée par POST/PUT /api/trades ET par le
 * pipeline d'import CSV (confirm), pour ne jamais avoir deux jeux de règles.
 */
export function validateTradeInput(body: Partial<TradeInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.symbol || !body.symbol.trim()) {
    errors.push({ field: "symbol", message: "Le symbole est requis." });
  }
  if (!body.direction || !["LONG", "SHORT"].includes(body.direction)) {
    errors.push({ field: "direction", message: "La direction doit être LONG ou SHORT." });
  }
  if (!body.entryDate || isNaN(new Date(body.entryDate).getTime())) {
    errors.push({ field: "entryDate", message: "Date d'entrée invalide ou manquante." });
  }
  if (
    body.entryPrice === undefined ||
    body.entryPrice === null ||
    isNaN(body.entryPrice) ||
    body.entryPrice <= 0
  ) {
    errors.push({ field: "entryPrice", message: "Le prix d'entrée doit être un nombre positif." });
  }
  if (
    body.positionSize === undefined ||
    body.positionSize === null ||
    isNaN(body.positionSize) ||
    body.positionSize <= 0
  ) {
    errors.push({ field: "positionSize", message: "La taille de position doit être un nombre positif." });
  }
  if (body.exitPrice !== undefined && body.exitPrice !== null) {
    if (isNaN(body.exitPrice) || body.exitPrice <= 0) {
      errors.push({ field: "exitPrice", message: "Le prix de sortie doit être un nombre positif." });
    }
  }
  if (body.stopLoss !== undefined && body.stopLoss !== null) {
    if (isNaN(body.stopLoss) || body.stopLoss <= 0) {
      errors.push({ field: "stopLoss", message: "Le Stop Loss doit être un nombre positif." });
    }
  }
  if (body.takeProfit !== undefined && body.takeProfit !== null) {
    if (isNaN(body.takeProfit) || body.takeProfit <= 0) {
      errors.push({ field: "takeProfit", message: "Le Take Profit doit être un nombre positif." });
    }
  }
  if (body.fees !== undefined && body.fees !== null && (isNaN(body.fees) || body.fees < 0)) {
    errors.push({ field: "fees", message: "Les frais ne peuvent pas être négatifs." });
  }
  if (body.exitDate && body.entryDate) {
    const entryTime = new Date(body.entryDate).getTime();
    const exitTime = new Date(body.exitDate).getTime();
    if (!isNaN(entryTime) && !isNaN(exitTime) && exitTime < entryTime) {
      errors.push({ field: "exitDate", message: "La date de sortie ne peut pas précéder la date d'entrée." });
    }
  }
  if (
    body.setupQuality !== undefined &&
    body.setupQuality !== null &&
    (body.setupQuality < 1 || body.setupQuality > 5)
  ) {
    errors.push({ field: "setupQuality", message: "La qualité du setup doit être comprise entre 1 et 5." });
  }

  return errors;
}