import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * IDs des profils suivis par un utilisateur — utilisé pour la visibilité
 * (posts privés) et pour le flag isFollowingAuthor dans les feeds.
 */
export async function getFollowingIds(viewerId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  return rows.map((r) => r.followingId);
}

/**
 * Clause Prisma garantissant qu'un post d'un profil privé n'est jamais
 * visible par un utilisateur qui ne le suit pas (et n'en est pas l'auteur).
 * Appliquée au niveau de la requête DB — jamais un filtrage a posteriori
 * côté application, pour ne jamais risquer d'exposer un post par erreur.
 */
export function buildVisiblePostsWhere(viewerId: string, followingIds: string[]): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    OR: [
      { userId: viewerId },
      { profile: { isPrivate: false } },
      { userId: { in: followingIds } },
    ],
  };
}