import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Liste blanche explicite des colonnes lisibles pour un profil consulté.
// initialCapital / riskPerTradePercent n'y figurent volontairement pas.
export const PUBLIC_PROFILE_SELECT = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  bio: true,
  tradingStyle: true,
  experienceLevel: true,
  isPrivate: true,
  showPerformance: true,
  showStats: true,
  showTrades: true,
  showHistory: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProfileSelect;

export type PublicProfileRow = Prisma.ProfileGetPayload<{ select: typeof PUBLIC_PROFILE_SELECT }>;

export interface ProfileAccess {
  isOwner: boolean;
  isFollowing: boolean;
  canViewContent: boolean;
  performance: boolean;
  stats: boolean;
  trades: boolean;
  history: boolean;
}

/**
 * Règle unique de confidentialité :
 * - le propriétaire voit tout ;
 * - un profil privé n'est visible que de ses followers ;
 * - sinon, chaque section dépend de son réglage show*.
 */
export function resolveProfileAccess(viewerId: string, target: PublicProfileRow, isFollowing: boolean): ProfileAccess {
  const isOwner = viewerId === target.id;
  const canViewContent = isOwner || !target.isPrivate || isFollowing;

  return {
    isOwner,
    isFollowing,
    canViewContent,
    performance: canViewContent && (isOwner || target.showPerformance),
    stats: canViewContent && (isOwner || target.showStats),
    trades: canViewContent && (isOwner || target.showTrades),
    history: canViewContent && (isOwner || target.showHistory),
  };
}

// Tolère un paramètre d'URL déjà décodé ou encore encodé.
export function normalizeUsernameParam(raw: string): string {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // paramètre non décodable : on garde la valeur brute
  }
  return decoded.trim().toLowerCase();
}

export async function loadProfileAccess(viewerId: string, rawUsername: string) {
  const username = normalizeUsernameParam(rawUsername);

  const target = await prisma.profile.findUnique({
    where: { username },
    select: PUBLIC_PROFILE_SELECT,
  });
  if (!target) return null;

  const follow =
    viewerId === target.id
      ? null
      : await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
          select: { id: true },
        });

  return { target, access: resolveProfileAccess(viewerId, target, !!follow) };
}