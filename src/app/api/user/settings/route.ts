import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { ProfileInput } from "@/types/profile";

// GET /api/user/settings — retourne le profil de l'utilisateur connecté
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let profile = await prisma.profile.findUnique({ where: { id: user.id } });

  if (!profile) {
    const baseUsername = (user.email?.split("@")[0] ?? "trader").toLowerCase().replace(/[^a-z0-9_]/g, "");
    const fallbackUsername = `${baseUsername}_${user.id.slice(0, 6)}`;

    profile = await prisma.profile.create({
      data: {
        id: user.id,
        username: fallbackUsername,
      },
    });
  }

  return NextResponse.json({ profile });
}

// PUT /api/user/settings — met à jour le profil
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as ProfileInput;

  // Validation minimale côté serveur
  if (!body.username || body.username.trim().length < 3) {
    return NextResponse.json(
      { error: "Le nom d'utilisateur doit contenir au moins 3 caractères." },
      { status: 400 }
    );
  }
  
  if (body.initialCapital !== null && body.initialCapital !== undefined && (isNaN(Number(body.initialCapital)) || body.initialCapital <= 0)) {
    return NextResponse.json(
      { error: "Le capital initial doit être un nombre positif." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        username: body.username.trim().toLowerCase(),
        fullName: body.fullName?.trim() || null,
        bio: body.bio?.trim() || null,
        experienceLevel: body.experienceLevel,
        initialCapital: body.initialCapital,
        language: body.language,
      },
      create: {
        id: user.id,
        username: body.username.trim().toLowerCase(),
        fullName: body.fullName?.trim() || null,
        bio: body.bio?.trim() || null,
        experienceLevel: body.experienceLevel,
        initialCapital: body.initialCapital,
        language: body.language,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris." }, { status: 409 });
    }
    console.error("Erreur lors de la mise à jour du profil :", err);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}