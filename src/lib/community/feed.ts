import { prisma } from "@/lib/prisma";
import { getFollowingIds, buildVisiblePostsWhere } from "@/lib/community/visibility";
import { serializePost, postInclude } from "@/lib/serializePost";
import type { FeedType, Post } from "@/types/post";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 10;
// Fenêtre d'échantillonnage pour "Popular" : score (likes+commentaires)
// calculé en mémoire sur les posts visibles les plus récents, faute de
// volumétrie justifiant une requête SQL agrégée dédiée à ce stade.
const POPULAR_WINDOW = 300;

const TYPE_FILTERS: Partial<Record<FeedType, Prisma.PostWhereInput>> = {
  trades: { type: "TRADE" },
  mistakes: { type: "MISTAKE" },
  lessons: { type: "LESSON" },
  setups: { type: "SETUP" },
};

export interface FeedResult {
  posts: Post[];
  nextCursor: string | null;
}

export async function getFeed(
  viewerId: string,
  feedType: FeedType,
  cursor: string | null
): Promise<FeedResult> {
  const followingIds = await getFollowingIds(viewerId);
  const followingSet = new Set(followingIds);
  const visibilityWhere = buildVisiblePostsWhere(viewerId, followingIds);

  if (feedType === "popular") {
    return getPopularFeed(viewerId, visibilityWhere, followingSet, cursor);
  }

  let where: Prisma.PostWhereInput = { ...visibilityWhere };

  if (feedType === "following") {
    where = { ...where, userId: { in: [...followingIds, viewerId] } };
  }

  const typeFilter = TYPE_FILTERS[feedType];
  if (typeFilter) where = { ...where, ...typeFilter };

  const rows = await prisma.post.findMany({
    where,
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: postInclude(viewerId),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return {
    posts: page.map((r) => serializePost(r as any, viewerId, followingSet)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

async function getPopularFeed(
  viewerId: string,
  visibilityWhere: Prisma.PostWhereInput,
  followingSet: Set<string>,
  cursor: string | null
): Promise<FeedResult> {
  const offset = cursor ? parseInt(cursor, 10) || 0 : 0;

  const candidates = await prisma.post.findMany({
    where: visibilityWhere,
    take: POPULAR_WINDOW,
    orderBy: { createdAt: "desc" },
    include: postInclude(viewerId),
  });

  const sorted = candidates
    .map((r) => ({ row: r, score: r._count.likes * 2 + r._count.comments }))
    .sort((a, b) => b.score - a.score || b.row.createdAt.getTime() - a.row.createdAt.getTime());

  const page = sorted.slice(offset, offset + PAGE_SIZE);
  const hasMore = offset + PAGE_SIZE < sorted.length;

  return {
    posts: page.map((x) => serializePost(x.row as any, viewerId, followingSet)),
    nextCursor: hasMore ? String(offset + PAGE_SIZE) : null,
  };
}