import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { loadProfileAccess } from "@/lib/community/profileAccess";
import { buildPublicTradingData } from "@/lib/community/publicStats";
import type { PublicProfileResponse } from "@/types/publicProfile";

interface Params {
  params: Promise<{ username: string }>;
}

// GET /api/users/:username — profil consulté, filtré par la confidentialité.
// Tout ce qui n'est pas autorisé pour ce visiteur est renvoyé à null : le
// frontend ne reçoit jamais une donnée privée.
export async function GET(_request: NextRequest, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const loaded = await loadProfileAccess(user.id, username);
    if (!loaded) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }
    const { target, access } = loaded;

    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: target.id } }),
      prisma.follow.count({ where: { followerId: target.id } }),
    ]);

    let postCount: number | null = null;

    if (access.canViewContent) {
      postCount = await prisma.post.count({
        where: { userId: target.id, deletedAt: null },
      });
    }

    const trading = await buildPublicTradingData(target.id, access);

    const response: PublicProfileResponse = {
      profile: {
        username: target.username,
        fullName: target.fullName,
        avatarUrl: target.avatarUrl,
        avatarVersion: target.updatedAt.toISOString(),
        bio: target.bio,
        tradingStyle: target.tradingStyle,
        experienceLevel: target.experienceLevel,
        joinedAt: target.createdAt.toISOString(),
        followerCount,
        followingCount,
        isOwnProfile: access.isOwner,
        isFollowing: access.isFollowing,
        isPrivate: target.isPrivate,
      },
      access: {
        canViewContent: access.canViewContent,
        performance: access.performance,
        stats: access.stats,
        trades: access.trades,
        history: access.history,
      },
      postCount,
      performance: trading.performance,
      stats: trading.stats,
      history: trading.history,
      trades: trading.trades,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Erreur lors du chargement du profil :", err);
    return NextResponse.json({ error: "Impossible de charger ce profil." }, { status: 500 });
  }
}