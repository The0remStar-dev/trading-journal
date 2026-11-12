import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getFollowingIds, buildVisiblePostsWhere } from "@/lib/community/visibility";
import { likeDedupeKey } from "@/lib/notifications/helpers";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/posts/:id/like
// Corps optionnel { like: boolean } : état souhaité (idempotent).
// Sans corps : bascule, comme avant.
// Le like et sa notification sont écrits dans la MÊME transaction.
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const followingIds = await getFollowingIds(user.id);
  const visibility = buildVisiblePostsWhere(user.id, followingIds);
  const post = await prisma.post.findFirst({ where: { id, ...visibility }, select: { id: true, userId: true } });
  if (!post) {
    return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  }

  const raw = await request.json().catch(() => null);
  const desired: boolean | null = raw && typeof raw.like === "boolean" ? raw.like : null;
  const key = likeDedupeKey(user.id, id);

  const run = (forced: boolean | null) =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { postId_userId: { postId: id, userId: user.id } },
      });
      const shouldLike = forced === null ? !existing : forced;

      if (shouldLike && !existing) {
        await tx.like.create({ data: { postId: id, userId: user.id } });
        // Jamais de notification pour un like sur sa propre publication.
        if (post.userId !== user.id) {
          await tx.notification.upsert({
            where: { dedupeKey: key },
            update: {},
            create: { recipientId: post.userId, actorId: user.id, type: "LIKE", postId: id, dedupeKey: key },
          });
        }
      } else if (!shouldLike && existing) {
        await tx.like.delete({ where: { id: existing.id } });
        await tx.notification.deleteMany({ where: { dedupeKey: key } });
      }

      const likeCount = await tx.like.count({ where: { postId: id } });
      return { liked: shouldLike, likeCount };
    });

  try {
    return NextResponse.json(await run(desired));
  } catch (err: any) {
    // Course : un like identique vient d'être créé en parallèle (contrainte
    // unique). L'intention était bien "liker" : on rejoue avec cet état forcé.
    if (err?.code === "P2002") {
      try {
        return NextResponse.json(await run(true));
      } catch (retryErr) {
        console.error("Erreur lors du like (rejeu) :", retryErr);
      }
    } else {
      console.error("Erreur lors du like :", err);
    }
    return NextResponse.json({ error: "Impossible d'enregistrer le like." }, { status: 500 });
  }
}