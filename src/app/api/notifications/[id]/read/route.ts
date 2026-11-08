import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await prisma.notification.updateMany({
    where: { id, recipientId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  if (result.count === 0) {
    const ownNotification = await prisma.notification.findFirst({
      where: { id, recipientId: user.id },
      select: { id: true },
    });
    if (!ownNotification) {
      return NextResponse.json({ error: "Notification introuvable." }, { status: 404 });
    }
  }

  return NextResponse.json({ success: true });
}
