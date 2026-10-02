import type { Direction, TradeEmotion } from "@/types/trade";
import type { ExperienceLevel } from "@/types/profile";

export type PostType = "TRADE" | "MISTAKE" | "LESSON" | "SETUP" | "WEEKLY_REVIEW";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  TRADE: "Trade",
  MISTAKE: "Erreur",
  LESSON: "Leçon",
  SETUP: "Setup",
  WEEKLY_REVIEW: "Bilan hebdo",
};

export interface PostAuthor {
  username: string;
  avatarUrl: string | null;
  experienceLevel: ExperienceLevel;
}

export interface Post {
  id: string;
  author: PostAuthor;
  type: PostType;
  title: string;
  emotion: TradeEmotion;
  mistakeSummary: string | null;
  lessonLearned: string | null;
  body: string | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  linkedTradeId: string | null;
  symbol: string | null;
  direction: Direction | null;
  entryPrice: number | null;
  exitPrice: number | null;
  rMultiple: number | null;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  isLikedByViewer: boolean;
  isSavedByViewer: boolean;
  isFollowingAuthor: boolean;
  isOwnPost: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  type: PostType;
  title: string;
  emotion: TradeEmotion;
  mistakeSummary: string | null;
  lessonLearned: string | null;
  body: string | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  linkedTradeId: string | null;
}

export interface SelectableTrade {
  id: string;
  symbol: string;
  direction: Direction;
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  rMultiple: number | null;
}

export type FeedType = "foryou" | "following" | "popular" | "trades" | "mistakes" | "lessons" | "setups";

export interface PostFeedResponse {
  posts: Post[];
  nextCursor: string | null;
}