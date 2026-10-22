import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadProfileAccess } from "@/lib/community/profileAccess";
import { getUserPosts } from "@/lib/community/feed";

interface Params {
  params: Promise<{ username: string }>;
}

// GET /api/users/:username/posts?cursor=... — publications paginées d'un profil.
export async function GET(request: NextRequest, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const loaded = await loadProfileAccess(user.id, username);
    if (!loaded) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }
    if (!loaded.access.canViewContent) {
      return NextResponse.json({ error: "Ce profil est privé." }, { status: 403 });
    }

    const cursor = new URL(request.url).searchParams.get("cursor");
    const result = await getUserPosts(user.id, loaded.target.id, cursor);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Erreur lors du chargement des publications du profil :", err);
    return NextResponse.json({ error: "Impossible de charger les publications." }, { status: 500 });
  }
}