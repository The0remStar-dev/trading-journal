import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsernameParam } from "@/lib/community/profileAccess";
import { followDedupeKey } from "@/lib/notifications/helpers";
import type { FollowStatusResponse } from "@/types/community";

interface Params {
  params: Promise<{ username: string }>;
}

async function resolveTarget(rawUsername: string) {
  return prisma.profile.findUnique({ where: { username: normalizeUsernameParam(rawUsername) } });
}

// GET /api/users/:username/follow : état + compteurs.
export async function GET(_request: NextRequest, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const target = await resolveTarget(username);
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const [isFollowing, followerCount, followingCount] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: user.id, followingId: target.id } } }),
    prisma.follow.count({ where: { followingId: target.id } }),
    prisma.follow.count({ where: { followerId: target.id } }),
  ]);

  const response: FollowStatusResponse = { isFollowing: !!isFollowing, followerCount, followingCount };
  return NextResponse.json(response);
}

// POST /api/users/:username/follow
// Corps optionnel { follow: boolean } : état souhaité (idempotent, protège
// contre les clics répétés ou un état affiché obsolète). Sans corps : bascule.
// Le follow et sa notification sont écrits dans la MÊME transaction.
export async function POST(request: NextRequest, { params }: Params) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const target = await resolveTarget(username);
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous suivre vous-même." }, { status: 400 });
  }

  const raw = await request.json().catch(() => null);
  const desired: boolean | null = raw && typeof raw.follow === "boolean" ? raw.follow : null;
  const key = followDedupeKey(user.id, target.id);

  const run = (forced: boolean | null) =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
      });
      const shouldFollow = forced === null ? !existing : forced;

      if (shouldFollow && !existing) {
        await tx.follow.create({ data: { followerId: user.id, followingId: target.id } });
        await tx.notification.upsert({
          where: { dedupeKey: key },
          update: {},
          create: { recipientId: target.id, actorId: user.id, type: "FOLLOW", dedupeKey: key },
        });
      } else if (!shouldFollow && existing) {
        await tx.follow.delete({ where: { id: existing.id } });
        await tx.notification.deleteMany({ where: { dedupeKey: key } });
      }

      const followerCount = await tx.follow.count({ where: { followingId: target.id } });
      return { isFollowing: shouldFollow, followerCount };
    });

  try {
    return NextResponse.json(await run(desired));
  } catch (err: any) {
    // Course : la relation vient d'être créée en parallèle → on rejoue avec l'état "suivi".
    if (err?.code === "P2002") {
      try {
        return NextResponse.json(await run(true));
      } catch (retryErr) {
        console.error("Erreur lors du follow (rejeu) :", retryErr);
      }
    } else {
      console.error("Erreur lors du follow :", err);
    }
    return NextResponse.json({ error: "Impossible de mettre à jour l'abonnement." }, { status: 500 });
  }
}