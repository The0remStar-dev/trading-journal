import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { serializePost } from "@/lib/serializePost";
import { computeRiskAmount, tradeToR } from "@/lib/rMultiple";
import type { PostInput, PostFeedResponse } from "@/types/post";

const PAGE_SIZE = 10;

// GET /api/posts?cursor=<postId> — feed paginé, plus récent en premier.
// Le curseur est l'id du dernier post reçu par le client ; on utilise
// createdAt+id pour un tri stable même en cas d'égalité de timestamp.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE + 1, // +1 pour savoir s'il reste une page suivante
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { profile: true },
  });

  const hasMore = posts.length > PAGE_SIZE;
  const pageItems = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

  const response: PostFeedResponse = {
    posts: pageItems.map(serializePost),
    nextCursor: hasMore ? pageItems[pageItems.length - 1].id : null,
  };

  return NextResponse.json(response);
}

// POST /api/posts — crée une publication, liée ou non à un trade du journal.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json()) as PostInput;

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Le titre est obligatoire." }, { status: 400 });
  }
  if (!body.mistakeSummary?.trim()) {
    return NextResponse.json({ error: "Le résumé de l'erreur est obligatoire." }, { status: 400 });
  }
  if (!body.lessonLearned?.trim()) {
    return NextResponse.json({ error: "La leçon apprise est obligatoire." }, { status: 400 });
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
      return NextResponse.json(
        { error: "Impossible de partager un trade encore ouvert." },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    const riskAmount = computeRiskAmount({
      initialCapital: profile?.initialCapital ?? null,
      riskPerTradePercent: profile?.riskPerTradePercent ?? null,
    });

    if (riskAmount === null) {
      return NextResponse.json(
        {
          error:
            "Configurez votre capital initial et votre risque par trade dans Paramètres avant de publier un trade.",
        },
        { status: 400 }
      );
    }

    symbol = trade.symbol;
    direction = trade.direction;
    entryPrice = trade.entryPrice;
    exitPrice = trade.exitPrice;
    rMultiple = tradeToR(trade.pnl, false, riskAmount);
  }

  const created = await prisma.post.create({
    data: {
      userId: user.id,
      title: body.title.trim(),
      emotion: body.emotion,
      mistakeSummary: body.mistakeSummary.trim(),
      lessonLearned: body.lessonLearned.trim(),
      beforeImageUrl: body.beforeImageUrl ?? null,
      afterImageUrl: body.afterImageUrl ?? null,
      linkedTradeId: body.linkedTradeId ?? null,
      symbol,
      direction,
      entryPrice,
      exitPrice,
      rMultiple,
    },
    include: { profile: true },
  });

  return NextResponse.json({ post: serializePost(created) }, { status: 201 });
}