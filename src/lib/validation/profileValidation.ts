import { EXPERIENCE_LEVEL_LABELS, LANGUAGE_LABELS, TRADING_STYLE_LABELS } from "@/types/profile";
import type { ProfileInput } from "@/types/profile";

export interface ValidationError {
  field: string;
  message: string;
}

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
export const BIO_MAX_LENGTH = 500;
const FULL_NAME_MAX_LENGTH = 80;

const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "root", "support", "tradeshare", "moderator",
  "mod", "system", "settings", "me", "null", "undefined", "api",
]);

const BOOLEAN_FIELDS = ["isPrivate", "showPerformance", "showStats", "showTrades", "showHistory"] as const;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Validation serveur du profil. Les règles strictes de username ne
 * s'appliquent que s'il CHANGE : un ancien compte au format libre peut
 * continuer à modifier le reste de son profil sans être bloqué.
 */
export function validateProfileInput(body: Partial<ProfileInput>, currentUsername: string): ValidationError[] {
  const errors: ValidationError[] = [];

  const username = typeof body.username === "string" ? normalizeUsername(body.username) : "";
  if (!username) {
    errors.push({ field: "username", message: "Le nom d'utilisateur est obligatoire." });
  } else if (username !== currentUsername.toLowerCase()) {
    if (!USERNAME_REGEX.test(username)) {
      errors.push({
        field: "username",
        message: "Le nom d'utilisateur doit faire 3 à 20 caractères : lettres minuscules, chiffres et underscore uniquement.",
      });
    } else if (RESERVED_USERNAMES.has(username)) {
      errors.push({ field: "username", message: "Ce nom d'utilisateur est réservé." });
    }
  }

  if (body.fullName !== null && body.fullName !== undefined) {
    if (typeof body.fullName !== "string" || body.fullName.trim().length > FULL_NAME_MAX_LENGTH) {
      errors.push({ field: "fullName", message: `Le nom complet ne peut pas dépasser ${FULL_NAME_MAX_LENGTH} caractères.` });
    }
  }

  if (body.bio !== null && body.bio !== undefined) {
    if (typeof body.bio !== "string" || body.bio.trim().length > BIO_MAX_LENGTH) {
      errors.push({ field: "bio", message: `La bio ne peut pas dépasser ${BIO_MAX_LENGTH} caractères.` });
    }
  }

  if (!body.experienceLevel || !Object.keys(EXPERIENCE_LEVEL_LABELS).includes(body.experienceLevel)) {
    errors.push({ field: "experienceLevel", message: "Niveau d'expérience invalide." });
  }
  if (!body.language || !Object.keys(LANGUAGE_LABELS).includes(body.language)) {
    errors.push({ field: "language", message: "Langue invalide." });
  }
  if (body.tradingStyle !== null && body.tradingStyle !== undefined) {
    if (!Object.keys(TRADING_STYLE_LABELS).includes(body.tradingStyle)) {
      errors.push({ field: "tradingStyle", message: "Style de trading invalide." });
    }
  }

  if (body.initialCapital !== null && body.initialCapital !== undefined) {
    if (typeof body.initialCapital !== "number" || !Number.isFinite(body.initialCapital) || body.initialCapital <= 0) {
      errors.push({ field: "initialCapital", message: "Le capital initial doit être un nombre positif." });
    }
  }

  if (
    typeof body.riskPerTradePercent !== "number" ||
    !Number.isFinite(body.riskPerTradePercent) ||
    body.riskPerTradePercent <= 0 ||
    body.riskPerTradePercent > 100
  ) {
    errors.push({ field: "riskPerTradePercent", message: "Le risque par trade doit être un pourcentage entre 0 et 100." });
  }

  for (const field of BOOLEAN_FIELDS) {
    if (typeof body[field] !== "boolean") {
      errors.push({ field, message: `Valeur invalide pour ${field}.` });
    }
  }

  return errors;
}