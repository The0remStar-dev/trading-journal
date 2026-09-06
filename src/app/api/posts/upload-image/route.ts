import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo — captures de graphiques
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "post-images";

// POST /api/posts/upload-image — upload un graphique (avant/après) vers
// Supabase Storage. Chaque image reçoit un nom unique (pas de post créé
// au moment de l'upload), pour permettre l'aperçu avant soumission finale.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format d'image non supporté (jpeg, png, webp uniquement)." },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "L'image dépasse la taille maximale de 5 Mo." }, { status: 400 });
  }

  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("Erreur upload post-images :", uploadError);
    return NextResponse.json({ error: "Échec de l'upload de l'image." }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return NextResponse.json({ url: publicUrlData.publicUrl });
}