import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// POST /api/user/avatar — upload la photo de profil dans le bucket "avatars"
// (dossier isolé par utilisateur) et met à jour Profile.avatarUrl.
export async function POST(request: NextRequest) {
  // 1. Correction : Ajout de await pour le client Supabase
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format d'image non supporté (jpeg, png, webp uniquement)." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "L'image dépasse la taille maximale de 3 Mo." }, { status: 400 });
  }

  // Chemin isolé par utilisateur : {user_id}/avatar.{ext} — écrase l'ancien avatar
  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `${user.id}/avatar.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: true, // remplace le fichier existant
    });

  if (uploadError) {
    console.error("Erreur upload Supabase Storage :", uploadError);
    return NextResponse.json({ error: "Échec de l'upload de l'image." }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  
  // Cache-buster pour forcer le rafraîchissement de l'image côté client après un upsert
  const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: { avatarUrl },
    create: { id: user.id, username: `trader_${user.id.slice(0, 8)}`, avatarUrl },
  });

  return NextResponse.json({ avatarUrl: profile.avatarUrl });
}