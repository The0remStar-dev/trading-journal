import type { ExperienceLevel, TradingStyle } from "@/types/profile";
import type { Direction, TradeStatus } from "@/types/trade";
import type { EquityPointR } from "@/types/analytics";

export interface PublicProfileIdentity {
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  avatarVersion: string; // sert uniquement à invalider le cache navigateur de l'avatar
  bio: string | null;
  tradingStyle: TradingStyle | null;
  experienceLevel: ExperienceLevel;
  joinedAt: string;
  followerCount: number;
  followingCount: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isPrivate: boolean;
}

// Ce que le serveur a décidé d'autoriser pour ce visiteur. Les sections
// refusées sont renvoyées à null : l'UI ne cache jamais une donnée reçue.
export interface ProfileAccessFlags {
  canViewContent: boolean;
  performance: boolean;
  stats: boolean;
  trades: boolean;
  history: boolean;
}

export interface PublicPerformance {
  totalR: number;
  winRate: number;
  hasData: boolean; // au moins un trade clôturé dont le R est calculable
}

export interface PublicStats {
  tradesCount: number;
  profitFactor: number | null; // null = infini ou non défini
  expectancyR: number;
  avgR: number;
  maxDrawdownR: number;
}

// Volontairement sans prix, taille, PnL, frais, notes ni captures.
export interface PublicTradeRow {
  symbol: string;
  direction: Direction;
  entryDate: string;
  status: TradeStatus;
  rMultiple: number | null;
  tags: string[];
}

export interface PublicProfileResponse {
  profile: PublicProfileIdentity;
  access: ProfileAccessFlags;
  postCount: number | null;
  performance: PublicPerformance | null;
  stats: PublicStats | null;
  history: EquityPointR[] | null;
  trades: PublicTradeRow[] | null;
}