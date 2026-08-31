// filepath: src/lib/profile.ts
import { prisma } from "@/lib/prisma";
import type { Profile as PrismaProfile } from "@prisma/client";

/**
 * Garantit qu'un Profile existe pour cet utilisateur, sans jamais écraser
 * un profil déjà existant (donc sans jamais toucher à avatarUrl).
 * Utilisé par les deux routes (settings + avatar) pour éviter toute
 * divergence de logique de création entre elles.
 */
export async function ensureProfile(
  userId: string,
  email: string | null | undefined
): Promise<PrismaProfile> {
  const existing = await prisma.profile.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const baseUsername = (email?.split("@")[0] ?? "trader")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  const fallbackUsername = `${baseUsername}_${userId.slice(0, 6)}`;

  return prisma.profile.create({
    data: { id: userId, username: fallbackUsername },
  });
}