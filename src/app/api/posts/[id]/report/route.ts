import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getFollowingIds, buildVisiblePostsWhere } from "@/lib/community/visibility";
import { ensureProfile } from "@/lib/profile";
import type { ReportInput } from "@/types/community";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/posts/:id/report
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

  const body = (await request.json()) as ReportInput;
  if (!body.reason || !body.reason.trim()) {
    return NextResponse.json({ error: "Merci de préciser une raison." }, { status: 400 });
  }

  const alreadyReported = await prisma.report.findFirst({
    where: { postId: id, reporterId: user.id, status: "PENDING" },
  });
  if (alreadyReported) {
    return NextResponse.json({ error: "Vous avez déjà signalé cette publication." }, { status: 409 });
  }

  await prisma.report.create({
    data: { postId: id, reporterId: user.id, reason: body.reason.trim() },
  });

  return NextResponse.json({ success: true });
}