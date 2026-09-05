export type AccountType = "LIVE" | "BACKTEST" | "EVALUATION";
export type Direction = "LONG" | "SHORT";
export type TradeStatus = "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";

export type TradeEmotion =
  | "FOMO"
  | "REVENGE"
  | "IMPATIENT"
  | "FEARFUL"
  | "GREEDY"
  | "CONFIDENT"
  | "PATIENT"
  | "DISCIPLINED"
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
  NEUTRAL: "Neutre",
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
  positionSize: number;
  fees: number;
  pnl: number;
  pnlPercentage: number;
  riskRewardRatio: number | null;
  status: TradeStatus;
  tags: string[];
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
  positionSize: number;
  fees: number;
  riskRewardRatio: number | null;
  tags: string[];
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
  emotion?: TradeEmotion | "ALL";
}