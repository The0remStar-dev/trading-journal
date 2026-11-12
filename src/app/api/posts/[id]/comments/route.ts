import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getFollowingIds, buildVisiblePostsWhere } from "@/lib/community/visibility";
import { commentDedupeKey } from "@/lib/notifications/helpers";
import type { Comment, CommentInput } from "@/types/community";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/posts/:id/comments
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const followingIds = await getFollowingIds(user.id);
  const visibility = buildVisiblePostsWhere(user.id, followingIds);
  const post = await prisma.post.findFirst({ where: { id, ...visibility } });
  if (!post) {
    return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  }

  const comments = await prisma.comment.findMany({
    where: { postId: id },
    include: { profile: true },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const serialized: Comment[] = comments.map((c) => ({
    id: c.id,
    postId: c.postId,
    author: { username: c.profile.username, avatarUrl: c.profile.avatarUrl },
    body: c.body,
    isOwnComment: c.userId === user.id,
    canDelete: c.userId === user.id || post.userId === user.id,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ comments: serialized });
}

// POST /api/posts/:id/comments : commentaire + notification dans la même transaction.
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const followingIds = await getFollowingIds(user.id);
  const visibility = buildVisiblePostsWhere(user.id, followingIds);
  const post = await prisma.post.findFirst({ where: { id, ...visibility } });
  if (!post) {
    return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as CommentInput | null;
  if (!body || typeof body.body !== "string" || !body.body.trim()) {
    return NextResponse.json({ error: "Le commentaire ne peut pas être vide." }, { status: 400 });
  }
  if (body.body.length > 2000) {
    return NextResponse.json({ error: "Commentaire trop long (2000 caractères max)." }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: { postId: id, userId: user.id, body: body.body.trim() },
        include: { profile: true },
      });

      // Jamais de notification quand on commente sa propre publication.
      if (post.userId !== user.id) {
        await tx.notification.create({
          data: {
            recipientId: post.userId,
            actorId: user.id,
            type: "COMMENT",
            postId: id,
            commentId: comment.id,
            dedupeKey: commentDedupeKey(comment.id),
          },
        });
      }
      return comment;
    });

    const comment: Comment = {
      id: created.id,
      postId: created.postId,
      author: { username: created.profile.username, avatarUrl: created.profile.avatarUrl },
      body: created.body,
      isOwnComment: true,
      canDelete: true,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error("Erreur lors de la création du commentaire :", err);
    return NextResponse.json({ error: "Impossible de publier le commentaire." }, { status: 500 });
  }
}