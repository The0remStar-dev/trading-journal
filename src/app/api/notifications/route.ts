import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { CommunityNotification } from "@/types/notification";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const search = request.nextUrl.searchParams;
  const requestedLimit = Number(search.get("limit") ?? 20);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 30) : 20;
  const unreadOnly = search.get("unreadOnly") === "true";
  const cursor = search.get("cursor");
  const where = { recipientId: user.id, ...(unreadOnly ? { isRead: false } : {}) };

  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        actor: { select: { username: true, avatarUrl: true } },
      },
    }),
    prisma.notification.count({ where: { recipientId: user.id, isRead: false } }),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const notifications: CommunityNotification[] = page.map((item) => ({
    id: item.id,
    type: item.type,
    actor: item.actor,
    postId: item.postId,
    commentId: item.commentId,
    targetHref: item.type === "FOLLOW"
      ? `/u/${encodeURIComponent(item.actor.username)}`
      : `/feed?post=${encodeURIComponent(item.postId ?? "")}${item.commentId ? `&comment=${encodeURIComponent(item.commentId)}` : ""}#post-${encodeURIComponent(item.postId ?? "")}`,
    isRead: item.isRead,
    createdAt: item.createdAt.toISOString(),
  }));

  return NextResponse.json({
    notifications,
    unreadCount,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}
