import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string; commentId: string }>;
}

// DELETE /api/posts/:id/comments/:commentId — auteur du commentaire ou du post.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { commentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { userId: true } } },
  });

  if (!comment) {
    return NextResponse.json({ error: "Commentaire introuvable." }, { status: 404 });
  }

  const canDelete = comment.userId === user.id || comment.post.userId === user.id;
  if (!canDelete) {
    return NextResponse.json({ error: "Vous n'êtes pas autorisé à supprimer ce commentaire." }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
}