export type AccountType = "LIVE" | "BACKTEST" | "EVALUATION";
export type Direction = "LONG" | "SHORT";
export type TradeStatus = "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";
export type Timeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1" | "W1" | "OTHER";

// Possédé ici (plutôt que dans types/analytics.ts) car c'est un attribut
// dérivé du trade lui-même ; analytics.ts le ré-exporte pour compatibilité.
export type SessionName = "Asie" | "Londres" | "New York" | "Autres";

export type TradeEmotion =
  | "FOMO"
  | "REVENGE"
  | "IMPATIENT"
  | "FEARFUL"
  | "GREEDY"
  | "CONFIDENT"
  | "PATIENT"
  | "DISCIPLINED"
  | "STRESSED"
  | "NEUTRAL";

export const EMOTION_LABELS: Record<TradeEmotion, string> = {
  FOMO: "FOMO",
  REVENGE: "Revenge Trading",
  IMPATIENT: "Impatient",
  FEARFUL: "Craintif",
  GREEDY: "Avide",
  CONFIDENT: "Confiant",
  PATIENT: "Patient",
  DISCIPLINED: "Discipliné",
  STRESSED: "Stressé",
  NEUTRAL: "Neutre",
};

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  M1: "1 min",
  M5: "5 min",
  M15: "15 min",
  M30: "30 min",
  H1: "1 heure",
  H4: "4 heures",
  D1: "Journalier",
  W1: "Hebdomadaire",
  OTHER: "Autre",
};

export interface Trade {
  id: string;
  accountType: AccountType;
  symbol: string;
  direction: Direction;
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSize: number;
  fees: number;
  pnl: number;
  pnlPercentage: number;
  riskRewardRatio: number | null;
  riskAmount: number | null;
  rMultiple: number | null;
  status: TradeStatus;
  tags: string[];
  timeframe: Timeframe | null;
  session: SessionName; // calculé à la sérialisation, jamais stocké
  setupQuality: number | null;
  planRespected: boolean | null;
  stopMoved: boolean;
  tpMoved: boolean;
  errorType: string | null;
  mistake: string | null;
  lesson: string | null;
  notes: string | null;
  emotion: TradeEmotion | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeInput {
  accountType: AccountType;
  symbol: string;
  direction: Direction;
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSize: number;
  fees: number;
  riskRewardRatio: number | null;
  tags: string[];
  timeframe: Timeframe | null;
  setupQuality: number | null;
  planRespected: boolean | null;
  stopMoved: boolean;
  tpMoved: boolean;
  errorType: string | null;
  mistake: string | null;
  lesson: string | null;
  notes: string | null;
  emotion: TradeEmotion | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
}

export interface TradeFilters {
  dateFrom?: string;
  dateTo?: string;
  symbol?: string;
  direction?: Direction | "ALL";
  status?: TradeStatus | "ALL";
  accountType?: AccountType | "ALL";
  tags?: string[];
}