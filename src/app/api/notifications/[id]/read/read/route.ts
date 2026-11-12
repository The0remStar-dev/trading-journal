import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { countUnread } from "@/lib/notifications/service";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/notifications/:id/read : idempotent, réservé au destinataire.
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    // 404 (jamais 403) si la notification n'est pas à toi : on ne révèle pas
    // l'existence de notifications appartenant à quelqu'un d'autre.
    const owned = await prisma.notification.findFirst({
      where: { id, recipientId: user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Notification introuvable." }, { status: 404 });
    }

    await prisma.notification.updateMany({
      where: { id, recipientId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true, unreadCount: await countUnread(user.id) });
  } catch (err) {
    console.error("Erreur lors du marquage de la notification :", err);
    return NextResponse.json({ error: "Impossible de mettre à jour la notification." }, { status: 500 });
  }
}