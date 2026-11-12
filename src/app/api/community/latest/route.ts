import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLatestRelevantPost } from "@/lib/community/latest";

// GET /api/community/latest : publication mise en avant sur le dashboard.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    return NextResponse.json({ post: await getLatestRelevantPost(user.id) });
  } catch (err) {
    console.error("Erreur lors du chargement de la dernière publication :", err);
    return NextResponse.json({ error: "Impossible de charger la publication." }, { status: 500 });
  }
}