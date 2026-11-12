import type { ExperienceLevel, TradingStyle } from "@/types/profile";

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW";
export type NotificationFilter = "all" | "unread";

export interface NotificationActor {
  username: string;
  avatarUrl: string | null;
  avatarVersion: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: NotificationActor;
  postId: string | null;
  postTitle: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface SuggestedProfile {
  username: string;
  avatarUrl: string | null;
  avatarVersion?: string;
  tradingStyle: TradingStyle | null;
  experienceLevel?: ExperienceLevel;
  bio: string | null;
  followerCount?: number;
  recentPostCount?: number;
}

export type ProfileSuggestion = SuggestedProfile;

export interface SuggestionsResponse {
  suggestions: SuggestedProfile[];
}