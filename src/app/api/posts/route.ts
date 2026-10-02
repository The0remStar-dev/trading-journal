import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { serializePost, postInclude } from "@/lib/serializePost";
import { getFollowingIds } from "@/lib/community/visibility";
import { getFeed } from "@/lib/community/feed";
import { validatePostInput } from "@/lib/validation/postValidation";
import { computeRiskAmount, tradeToR } from "@/lib/rMultiple";
import { ensureProfile } from "@/lib/profile";
import type { PostInput, FeedType } from "@/types/post";

const VALID_FEED_TYPES: FeedType[] = ["foryou", "following", "popular", "trades", "mistakes", "lessons", "setups"];

// GET /api/posts?feed=foryou&cursor=<...>
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const feedParam = searchParams.get("feed") ?? "foryou";
  const feedType: FeedType = VALID_FEED_TYPES.includes(feedParam as FeedType) ? (feedParam as FeedType) : "foryou";
  const cursor = searchParams.get("cursor");

  try {
    const result = await getFeed(user.id, feedType, cursor);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Erreur lors du chargement du feed :", err);
    return NextResponse.json({ error: "Impossible de charger le feed." }, { status: 500 });
  }
}

// POST /api/posts — crée une publication, liée ou non à un trade du journal.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  await ensureProfile(user.id, user.email);

  const body = (await request.json()) as PostInput;

  const validationErrors = validatePostInput(body);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: "Publication invalide.", details: validationErrors }, { status: 400 });
  }

  let symbol: string | null = null;
  let direction: "LONG" | "SHORT" | null = null;
  let entryPrice: number | null = null;
  let exitPrice: number | null = null;
  let rMultiple: number | null = null;

  if (body.linkedTradeId) {
    const trade = await prisma.trade.findFirst({
      where: { id: body.linkedTradeId, userId: user.id },
    });

    if (!trade) {
      return NextResponse.json(
        { error: "Le trade sélectionné est introuvable ou ne vous appartient pas." },
        { status: 404 }
      );
    }
    if (trade.status === "OPEN") {
      return NextResponse.json({ error: "Impossible de partager un trade encore ouvert." }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    const riskAmount = computeRiskAmount({
      initialCapital: profile?.initialCapital ?? null,
      riskPerTradePercent: profile?.riskPerTradePercent ?? null,
    });

    if (riskAmount === null) {
      return NextResponse.json(
        { error: "Configurez votre capital initial et votre risque par trade dans Paramètres avant de publier un trade." },
        { status: 400 }
      );
    }

    symbol = trade.symbol;
    direction = trade.direction;
    entryPrice = trade.entryPrice;
    exitPrice = trade.exitPrice;
    rMultiple = tradeToR(trade.pnl, false, riskAmount);
  }

  try {
    const created = await prisma.post.create({
      data: {
        userId: user.id,
        type: body.type,
        title: body.title.trim(),
        emotion: body.emotion,
        mistakeSummary: body.mistakeSummary?.trim() || null,
        lessonLearned: body.lessonLearned?.trim() || null,
        body: body.body?.trim() || null,
        beforeImageUrl: body.beforeImageUrl ?? null,
        afterImageUrl: body.afterImageUrl ?? null,
        linkedTradeId: body.linkedTradeId ?? null,
        symbol,
        direction,
        entryPrice,
        exitPrice,
        rMultiple,
      },
      include: postInclude(user.id),
    });

    const followingIds = await getFollowingIds(user.id);
    return NextResponse.json(
      { post: serializePost(created as any, user.id, new Set(followingIds)) },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erreur lors de la création du post :", err);
    return NextResponse.json({ error: "Impossible de créer la publication." }, { status: 500 });
  }
}