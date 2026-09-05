import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import type { ProfileInput } from "@/types/profile";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const profile = await ensureProfile(user.id, user.email);
  return NextResponse.json({ profile });
}

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

  if (!body.username || body.username.trim().length < 3) {
    return NextResponse.json(
      { error: "Le nom d'utilisateur doit contenir au moins 3 caractères." },
      { status: 400 }
    );
  }
  if (body.initialCapital !== null && (isNaN(body.initialCapital) || body.initialCapital <= 0)) {
    return NextResponse.json(
      { error: "Le capital initial doit être un nombre positif." },
      { status: 400 }
    );
  }
  if (
    body.riskPerTradePercent === undefined ||
    isNaN(body.riskPerTradePercent) ||
    body.riskPerTradePercent <= 0 ||
    body.riskPerTradePercent > 100
  ) {
    return NextResponse.json(
      { error: "Le risque par trade doit être un pourcentage entre 0 et 100." },
      { status: 400 }
    );
  }

  await ensureProfile(user.id, user.email);

  try {
    const updated = await prisma.profile.update({
      where: { id: user.id },
      data: {
        username: body.username.trim().toLowerCase(),
        fullName: body.fullName?.trim() || null,
        bio: body.bio?.trim() || null,
        experienceLevel: body.experienceLevel,
        initialCapital: body.initialCapital,
        riskPerTradePercent: body.riskPerTradePercent,
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