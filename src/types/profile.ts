export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type Language = "FR" | "EN" | "ES";
export type TradingStyle = "SCALPER" | "DAY_TRADER" | "SWING_TRADER" | "POSITION_TRADER" | "OTHER";

export interface Profile {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  tradingStyle: TradingStyle | null;
  experienceLevel: ExperienceLevel;
  initialCapital: number | null;
  riskPerTradePercent: number;
  language: Language;
  isPrivate: boolean;
  showPerformance: boolean;
  showStats: boolean;
  showTrades: boolean;
  showHistory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileInput {
  username: string;
  fullName: string | null;
  bio: string | null;
  tradingStyle: TradingStyle | null;
  experienceLevel: ExperienceLevel;
  initialCapital: number | null;
  riskPerTradePercent: number;
  language: Language;
  isPrivate: boolean;
  showPerformance: boolean;
  showStats: boolean;
  showTrades: boolean;
  showHistory: boolean;
}

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: "Débutant (< 1 an)",
  INTERMEDIATE: "Intermédiaire (1-3 ans)",
  ADVANCED: "Avancé (3-5 ans)",
  EXPERT: "Expert (> 5 ans)",
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  FR: "Français",
  EN: "English",
  ES: "Español",
};

export const TRADING_STYLE_LABELS: Record<TradingStyle, string> = {
  SCALPER: "Scalper",
  DAY_TRADER: "Day trader",
  SWING_TRADER: "Swing trader",
  POSITION_TRADER: "Position trader",
  OTHER: "Autre",
};