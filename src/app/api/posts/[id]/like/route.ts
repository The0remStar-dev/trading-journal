import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getFollowingIds, buildVisiblePostsWhere } from "@/lib/community/visibility";
import { ensureProfile } from "@/lib/profile";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/posts/:id/like — toggle, persistant, idempotent côté état.
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  await ensureProfile(user.id, user.email);

  const followingIds = await getFollowingIds(user.id);
  const visibility = buildVisiblePostsWhere(user.id, followingIds);
  const post = await prisma.post.findFirst({ where: { id, ...visibility } });
  if (!post) {
    return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  }

  const body: { liked?: unknown } = await request.json().catch(() => ({}));
  if (body.liked !== undefined && typeof body.liked !== "boolean") {
    return NextResponse.json({ error: "État du like invalide." }, { status: 400 });
  }
  const requestedState =
    typeof body.liked === "boolean" ? body.liked : undefined;

  const liked = await prisma.$transaction(async (tx) => {
    const existing = await tx.like.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
      select: { id: true },
    });
    const nextLiked = requestedState ?? !existing;

    if (nextLiked) {
      const like = await tx.like.upsert({
        where: { postId_userId: { postId: id, userId: user.id } },
        create: { postId: id, userId: user.id },
        update: {},
        select: { id: true },
      });

      if (post.userId !== user.id) {
        await tx.notification.upsert({
          where: {
            dedupeKey: `like:${id}:${user.id}`,
          },
          create: {
            recipientId: post.userId,
            actorId: user.id,
            type: "LIKE",
            dedupeKey: `like:${id}:${user.id}`,
            postId: id,
          },
          update: {},
        });
      }
      return Boolean(like);
    }

    if (existing) {
      await tx.like.delete({ where: { id: existing.id } });
      await tx.notification.deleteMany({
        where: {
          recipientId: post.userId,
          actorId: user.id,
          type: "LIKE",
          dedupeKey: `like:${id}:${user.id}`,
        },
      });
    }
    return false;
  });

  const likeCount = await prisma.like.count({ where: { postId: id } });
  return NextResponse.json({ liked, likeCount });
}