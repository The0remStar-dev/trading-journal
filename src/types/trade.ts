export type AccountType = "LIVE" | "BACKTEST" | "EVALUATION";
export type Direction = "LONG" | "SHORT";
export type TradeStatus = "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";

// Client-side shape: tags is a parsed string[], not the raw JSON string stored in the DB.
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
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Payload shape sent from the trade form to the API.
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
