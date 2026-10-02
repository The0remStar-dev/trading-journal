import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { serializePost, postInclude } from "@/lib/serializePost";
import { getFollowingIds, buildVisiblePostsWhere } from "@/lib/community/visibility";
import { validatePostInput } from "@/lib/validation/postValidation";
import type { PostInput } from "@/types/post";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/posts/:id — 404 (jamais 403) si privé et non autorisé, pour ne
// pas révéler l'existence du post à un tiers non autorisé.
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const followingIds = await getFollowingIds(user.id);
  const where = buildVisiblePostsWhere(user.id, followingIds);

  const post = await prisma.post.findFirst({
    where: { id, ...where },
    include: postInclude(user.id),
  });

  if (!post) {
    return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
  }

  return NextResponse.json({ post: serializePost(post as any, user.id, new Set(followingIds)) });
}

// PUT /api/posts/:id — seul l'auteur peut modifier son post.
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const existing = await prisma.post.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Publication introuvable ou vous n'en êtes pas l'auteur." }, { status: 404 });
  }

  const body = (await request.json()) as PostInput;
  const validationErrors = validatePostInput(body);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: "Publication invalide.", details: validationErrors }, { status: 400 });
  }

  // Le trade lié n'est pas modifiable après coup : garantit que le snapshot
  // R affiché publiquement reste un reflet figé, jamais recalculé en douce.
  const updated = await prisma.post.update({
    where: { id },
    data: {
      type: body.type,
      title: body.title.trim(),
      emotion: body.emotion,
      mistakeSummary: body.mistakeSummary?.trim() || null,
      lessonLearned: body.lessonLearned?.trim() || null,
      body: body.body?.trim() || null,
      beforeImageUrl: body.beforeImageUrl ?? null,
      afterImageUrl: body.afterImageUrl ?? null,
    },
    include: postInclude(user.id),
  });

  const followingIds = await getFollowingIds(user.id);
  return NextResponse.json({ post: serializePost(updated as any, user.id, new Set(followingIds)) });
}

// DELETE /api/posts/:id — seul l'auteur peut supprimer son post.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const existing = await prisma.post.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Publication introuvable ou vous n'en êtes pas l'auteur." }, { status: 404 });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}