import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/notifications/read-all : ne touche que les notifications de l'utilisateur connecté.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const result = await prisma.notification.updateMany({
      where: { recipientId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ success: true, updated: result.count, unreadCount: 0 });
  } catch (err) {
    console.error("Erreur lors du marquage global :", err);
    return NextResponse.json({ error: "Impossible de mettre à jour les notifications." }, { status: 500 });
  }
}