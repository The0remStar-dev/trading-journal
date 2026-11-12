import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getFollowingIds } from "@/lib/community/visibility";
import { truncate } from "@/lib/notifications/helpers";
import type { Prisma } from "@prisma/client";

type SuggestionsResponse = {
  suggestions: Array<{
    username: string;
    avatarUrl: string | null;
    avatarVersion: string;
    tradingStyle: string | null;
    bio: string | null;
    followerCount: number;
    recentPostCount: number;
  }>;
};

const ACTIVITY_WINDOW_DAYS = 60;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

// GET /api/community/suggestions?limit=5
// Critères simples et explicables :
//  - profil PUBLIC (les comptes privés ne sont jamais suggérés) ;
//  - au moins une publication non supprimée dans les 60 derniers jours ;
//  - ni toi, ni un compte que tu suis déjà ;
//  - tri : nombre d'abonnés, puis nombre de publications récentes.
// (Le projet n'a pas de système de blocage : il n'y a donc rien à exclure à ce titre.)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const parsedLimit = parseInt(new URL(request.url).searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    const followingIds = await getFollowingIds(user.id);
    const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 86_400_000);
    const recentPosts: Prisma.PostWhereInput = { deletedAt: null, createdAt: { gte: since } };

    // select explicite : initialCapital & co ne sont jamais lus.
    const rows = await prisma.profile.findMany({
      where: {
        id: { notIn: [user.id, ...followingIds] },
        isPrivate: false,
        posts: { some: recentPosts },
      },
      select: {
        username: true,
        avatarUrl: true,
        bio: true,
        tradingStyle: true,
        updatedAt: true,
        _count: { select: { followers: true, posts: { where: recentPosts } } },
      },
      orderBy: [{ followers: { _count: "desc" } }, { posts: { _count: "desc" } }, { id: "asc" }],
      take: limit,
    });

    const response: SuggestionsResponse = {
      suggestions: rows.map((r) => ({
        username: r.username,
        avatarUrl: r.avatarUrl,
        avatarVersion: r.updatedAt.toISOString(),
        tradingStyle: r.tradingStyle,
        bio: r.bio ? truncate(r.bio, 120) : null,
        followerCount: r._count.followers,
        recentPostCount: r._count.posts,
      })),
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Erreur lors du calcul des suggestions :", err);
    return NextResponse.json({ error: "Impossible de charger les suggestions." }, { status: 500 });
  }
}