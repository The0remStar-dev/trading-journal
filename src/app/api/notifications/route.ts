import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { countUnread, listNotifications } from "@/lib/notifications/service";

type NotificationFilter = "all" | "unread";
type NotificationListResponse = Awaited<ReturnType<typeof listNotifications>> & {
  unreadCount: number;
};

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 30;

// GET /api/notifications?filter=all|unread&limit=15&cursor=<id>
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const filter: NotificationFilter = params.get("filter") === "unread" ? "unread" : "all";
  const parsedLimit = parseInt(params.get("limit") ?? "", 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT) : DEFAULT_LIMIT;
  const cursor = params.get("cursor");

  try {
    const [page, unreadCount] = await Promise.all([
      listNotifications(user.id, { filter, cursor, limit }),
      countUnread(user.id),
    ]);

    const response: NotificationListResponse = { ...page, unreadCount };
    return NextResponse.json(response);
  } catch (err) {
    console.error("Erreur lors du chargement des notifications :", err);
    return NextResponse.json({ error: "Impossible de charger les notifications." }, { status: 500 });
  }
}