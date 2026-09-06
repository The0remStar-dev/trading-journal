import type { Profile as PrismaProfile } from "@prisma/client";
import type { Post } from "@/types/post";

type PostWithProfile = Record<string, any> & { profile: PrismaProfile };

export function serializePost(row: PostWithProfile): Post {
  return {
    id: row.id,
    author: {
      username: row.profile.username,
      avatarUrl: row.profile.avatarUrl,
      experienceLevel: row.profile.experienceLevel,
    },
    title: row.title,
    emotion: row.emotion,
    mistakeSummary: row.mistakeSummary,
    lessonLearned: row.lessonLearned,
    beforeImageUrl: row.beforeImageUrl,
    afterImageUrl: row.afterImageUrl,
    linkedTradeId: row.linkedTradeId,
    symbol: row.symbol,
    direction: row.direction,
    entryPrice: row.entryPrice,
    exitPrice: row.exitPrice,
    rMultiple: row.rMultiple,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}