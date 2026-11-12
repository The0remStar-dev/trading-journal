import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { countUnread } from "@/lib/notifications/service";

// GET /api/notifications/unread-count : requête légère pour le badge (polling).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    return NextResponse.json({ unreadCount: await countUnread(user.id) });
  } catch (err) {
    console.error("Erreur lors du comptage des notifications :", err);
    return NextResponse.json({ error: "Impossible de compter les notifications." }, { status: 500 });
  }
}