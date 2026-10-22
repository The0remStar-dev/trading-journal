import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { validateProfileInput, normalizeUsername } from "@/lib/validation/profileValidation";
import type { ProfileInput } from "@/types/profile";

// GET /api/user/settings — profil complet de l'utilisateur connecté (lui seul).
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const profile = await ensureProfile(user.id, user.email);
  return NextResponse.json({ profile });
}

// PUT /api/user/settings
// Sécurité : la cible de la mise à jour est TOUJOURS user.id issu de la
// session Supabase. Aucun id n'est lu dans le body, et seuls les champs
// listés explicitement ci-dessous sont écrits.
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ProfileInput | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const current = await ensureProfile(user.id, user.email);

  const errors = validateProfileInput(body, current.username);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message, details: errors }, { status: 400 });
  }

  const username = normalizeUsername(body.username);

  if (username !== current.username.toLowerCase()) {
    const taken = await prisma.profile.findUnique({ where: { username }, select: { id: true } });
    if (taken && taken.id !== user.id) {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris." }, { status: 409 });
    }
  }

  try {
    const updated = await prisma.profile.update({
      where: { id: user.id },
      data: {
        username,
        fullName: body.fullName?.trim() || null,
        bio: body.bio?.trim() || null,
        tradingStyle: body.tradingStyle ?? null,
        experienceLevel: body.experienceLevel,
        initialCapital: body.initialCapital,
        riskPerTradePercent: body.riskPerTradePercent,
        language: body.language,
        isPrivate: body.isPrivate,
        showPerformance: body.showPerformance,
        showStats: body.showStats,
        showTrades: body.showTrades,
        showHistory: body.showHistory,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    // Filet de sécurité contre une course entre deux changements simultanés.
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris." }, { status: 409 });
    }
    console.error("Erreur lors de la mise à jour du profil :", err);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}