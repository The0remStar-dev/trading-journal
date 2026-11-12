import { prisma } from "@/lib/prisma";
import { getFollowingIds, buildVisiblePostsWhere } from "@/lib/community/visibility";
import { serializePost, postInclude } from "@/lib/serializePost";
import type { Post } from "@/types/post";

/**
 * Publication mise en avant sur le dashboard. Règle déterministe :
 *   1. la plus récente publication VISIBLE d'un autre utilisateur ;
 *   2. à défaut, ta propre publication la plus récente ;
 *   3. sinon null (état vide).
 * La clause de visibilité standard est appliquée au niveau de la requête.
 */
export async function getLatestRelevantPost(viewerId: string): Promise<Post | null> {
  const followingIds = await getFollowingIds(viewerId);
  const followingSet = new Set(followingIds);
  const visibility = buildVisiblePostsWhere(viewerId, followingIds);
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

  const fromOthers = await prisma.post.findFirst({
    where: { ...visibility, userId: { not: viewerId } },
    orderBy,
    include: postInclude(viewerId),
  });

  const row =
    fromOthers ??
    (await prisma.post.findFirst({
      where: { ...visibility, userId: viewerId },
      orderBy,
      include: postInclude(viewerId),
    }));

  return row ? serializePost(row as any, viewerId, followingSet) : null;
}