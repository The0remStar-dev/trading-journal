import type { Trade } from "@/types/trade";

const LEVEL_THRESHOLDS = [
  { level: 1, label: "Trader débutant", minTrades: 0 },
  { level: 2, label: "Trader régulier", minTrades: 25 },
  { level: 3, label: "Trader méthodique", minTrades: 75 },
  { level: 4, label: "Trader discipliné", minTrades: 150 },
  { level: 5, label: "Trader confirmé", minTrades: 300 },
];

export interface LevelInfo {
  level: number;
  label: string;
  progressPercent: number;
  tradesInLevel: number;
  tradesToNextLevel: number | null;
}

/**
 * Niveau dérivé du nombre de trades clôturés — placeholder honnête en
 * l'absence d'un vrai module Challenges/XP. À remplacer si ce module existe.
 */
export function computeLevel(closedTradesCount: number): LevelInfo {
  let current = LEVEL_THRESHOLDS[0];
  let next: (typeof LEVEL_THRESHOLDS)[number] | null = null;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (closedTradesCount >= LEVEL_THRESHOLDS[i].minTrades) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? null;
    }
  }

  const tradesInLevel = closedTradesCount - current.minTrades;
  const levelSpan = next ? next.minTrades - current.minTrades : tradesInLevel || 1;
  const progressPercent = next ? Math.min(100, (tradesInLevel / levelSpan) * 100) : 100;

  return {
    level: current.level,
    label: current.label,
    progressPercent: Number(progressPercent.toFixed(0)),
    tradesInLevel,
    tradesToNextLevel: next ? next.minTrades - closedTradesCount : null,
  };
}

/** Nombre de jours consécutifs (jusqu'à aujourd'hui ou hier) avec au moins un trade loggé. */
export function computeLoggingStreak(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const days = new Set(trades.map((t) => new Date(t.entryDate).toISOString().slice(0, 10)));

  let streak = 0;
  const cursor = new Date();
  // Si rien n'a été loggé aujourd'hui, on commence le décompte à hier plutôt
  // que de casser le streak immédiatement sur la journée en cours.
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}