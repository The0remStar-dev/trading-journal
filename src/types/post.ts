import type { Direction, TradeEmotion } from "@/types/trade";
import type { ExperienceLevel } from "@/types/profile";

export interface PostAuthor {
  username: string;
  avatarUrl: string | null;
  experienceLevel: ExperienceLevel;
}

export interface Post {
  id: string;
  author: PostAuthor;
  title: string;
  emotion: TradeEmotion;
  mistakeSummary: string;
  lessonLearned: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  linkedTradeId: string | null;
  symbol: string | null;
  direction: Direction | null;
  entryPrice: number | null;
  exitPrice: number | null;
  rMultiple: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title: string;
  emotion: TradeEmotion;
  mistakeSummary: string;
  lessonLearned: string;
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

export interface PostFeedResponse {
  posts: Post[];
  nextCursor: string | null;
}