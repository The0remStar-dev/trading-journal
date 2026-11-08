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

// POST /api/users/:username/follow — set the requested state (legacy callers may omit it).
export async function POST(request: NextRequest, { params }: Params) {
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

  const body: { isFollowing?: unknown } = await request.json().catch(() => ({}));
  if (body.isFollowing !== undefined && typeof body.isFollowing !== "boolean") {
    return NextResponse.json({ error: "État de suivi invalide." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
      select: { id: true },
    });
    const shouldFollow = body.isFollowing ?? !existing;

    if (shouldFollow) {
      const follow = await tx.follow.upsert({
        where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
        create: { followerId: user.id, followingId: target.id },
        update: {},
        select: { id: true },
      });

      await tx.notification.upsert({
        where: {
          dedupeKey: `follow:${follow.id}`,
        },
        create: {
          recipientId: target.id,
          actorId: user.id,
          type: "FOLLOW",
          dedupeKey: `follow:${follow.id}`,
        },
        update: {},
      });
    } else if (existing) {
      await tx.notification.deleteMany({
        where: {
          recipientId: target.id,
          actorId: user.id,
          type: "FOLLOW",
          dedupeKey: `follow:${existing.id}`,
        },
      });
      await tx.follow.delete({ where: { id: existing.id } });
    }
  });

  const [isFollowing, followerCount] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
      select: { id: true },
    }),
    prisma.follow.count({ where: { followingId: target.id } }),
  ]);
  return NextResponse.json({ isFollowing: Boolean(isFollowing), followerCount });
}