import type { Post as PrismaPost, Profile as PrismaProfile, Like, Save } from "@prisma/client";
import type { Post } from "@/types/post";

type PostRow = PrismaPost & {
  profile: PrismaProfile;
  _count: { likes: number; comments: number; saves: number };
  likes: Pick<Like, "id">[]; // pré-filtré par userId=viewer dans la requête
  saves: Pick<Save, "id">[]; // idem
};

export function serializePost(row: PostRow, viewerId: string, followingIds: Set<string>): Post {
  return {
    id: row.id,
    author: {
      username: row.profile.username,
      avatarUrl: row.profile.avatarUrl,
      experienceLevel: row.profile.experienceLevel,
    },
    type: row.type,
    title: row.title,
    emotion: row.emotion,
    mistakeSummary: row.mistakeSummary,
    lessonLearned: row.lessonLearned,
    body: row.body,
    beforeImageUrl: row.beforeImageUrl,
    afterImageUrl: row.afterImageUrl,
    linkedTradeId: row.linkedTradeId,
    symbol: row.symbol,
    direction: row.direction,
    entryPrice: row.entryPrice,
    exitPrice: row.exitPrice,
    rMultiple: row.rMultiple,
    likeCount: row._count.likes,
    commentCount: row._count.comments,
    saveCount: row._count.saves,
    isLikedByViewer: row.likes.length > 0,
    isSavedByViewer: row.saves.length > 0,
    isFollowingAuthor: followingIds.has(row.userId),
    isOwnPost: row.userId === viewerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Include Prisma standard pour toute requête de post destinée à être sérialisée. */
export function postInclude(viewerId: string) {
  return {
    profile: true,
    _count: { select: { likes: true, comments: true, saves: true } },
    likes: { where: { userId: viewerId }, select: { id: true } },
    saves: { where: { userId: viewerId }, select: { id: true } },
  } as const;
}