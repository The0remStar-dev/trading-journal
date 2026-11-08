import type { ExperienceLevel, TradingStyle } from "@/types/profile";

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW";

export interface CommunityNotification {
  id: string;
  type: NotificationType;
  actor: {
    username: string;
    avatarUrl: string | null;
  };
  postId: string | null;
  commentId: string | null;
  targetHref: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProfileSuggestion {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  tradingStyle: TradingStyle | null;
  experienceLevel: ExperienceLevel;
}
