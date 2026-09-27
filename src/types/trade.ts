export type AccountType = "LIVE" | "BACKTEST" | "EVALUATION";
export type Direction = "LONG" | "SHORT";
export type Timeframe = string;
export type TradeStatus = "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";

export const TIMEFRAME_LABELS: Record<string, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "4h": "4h",
  "1D": "1D",
  "1W": "1W",
  "1M": "1M",
};

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
  rMultiple: number | null;
  timeframe: string | null;
  stopLoss: number | null;
  planRespected: boolean | null;
  stopMoved: boolean;
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