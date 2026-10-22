import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import type { FollowStatusResponse } from "@/types/community";

interface Params {
  params: Promise<{ username: string }>;
}

async function resolveTarget(username: string) {
  return prisma.profile.findUnique({ where: { username } });
}

// GET /api/users/:username/follow — état + compteurs.
export async function GET(_request: NextRequest, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const target = await resolveTarget(username);
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const [isFollowing, followerCount, followingCount] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: user.id, followingId: target.id } } }),
    prisma.follow.count({ where: { followingId: target.id } }),
    prisma.follow.count({ where: { followerId: target.id } }),
  ]);

  const response: FollowStatusResponse = { isFollowing: !!isFollowing, followerCount, followingCount };
  return NextResponse.json(response);
}

// POST /api/users/:username/follow — toggle, persistant.
export async function POST(_request: NextRequest, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  await ensureProfile(user.id, user.email);

  const target = await resolveTarget(username);
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous suivre vous-même." }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId: user.id, followingId: target.id } });
  }

  const followerCount = await prisma.follow.count({ where: { followingId: target.id } });
  return NextResponse.json({ isFollowing: !existing, followerCount });
}