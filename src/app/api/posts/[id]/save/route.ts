import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getFollowingIds, buildVisiblePostsWhere } from "@/lib/community/visibility";
import { ensureProfile } from "@/lib/profile";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/posts/:id/save — toggle, persistant.
export async function POST(_request: NextRequest, { params }: Params) {
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

  const existing = await prisma.save.findUnique({
    where: { postId_userId: { postId: id, userId: user.id } },
  });

  if (existing) {
    await prisma.save.delete({ where: { id: existing.id } });
  } else {
    await prisma.save.create({ data: { postId: id, userId: user.id } });
  }

  const saveCount = await prisma.save.count({ where: { postId: id } });
  return NextResponse.json({ saved: !existing, saveCount });
}