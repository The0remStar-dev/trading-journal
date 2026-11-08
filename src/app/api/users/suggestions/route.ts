import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getFollowingIds } from "@/lib/community/visibility";
import type { ProfileSuggestion } from "@/types/notification";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const followingIds = await getFollowingIds(user.id);
  const profiles = await prisma.profile.findMany({
    where: {
      id: { notIn: [user.id, ...followingIds] },
      isPrivate: false,
      posts: { some: { deletedAt: null } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: 5,
    select: {
      username: true,
      avatarUrl: true,
      bio: true,
      tradingStyle: true,
      experienceLevel: true,
    },
  });

  const suggestions: ProfileSuggestion[] = profiles;
  return NextResponse.json({ suggestions });
}
