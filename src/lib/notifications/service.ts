import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type NotificationFilter = "all" | "unread";

export type NotificationItem = {
  id: string;
  type: string;
  actor: {
    username: string | null;
    avatarUrl: string | null;
    avatarVersion: string;
  };
  postId: string | null;
  postTitle: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
};

// Champs minimaux exposés : jamais l'email, le capital ni aucune donnée privée.
export const NOTIFICATION_INCLUDE = {
  actor: { select: { username: true, avatarUrl: true, updatedAt: true } },
  post: { select: { title: true } },
} satisfies Prisma.NotificationInclude;

type NotificationRow = Prisma.NotificationGetPayload<{ include: typeof NOTIFICATION_INCLUDE }>;

export function serializeNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    actor: {
      username: row.actor.username,
      avatarUrl: row.actor.avatarUrl,
      avatarVersion: row.actor.updatedAt.toISOString(),
    },
    postId: row.postId,
    postTitle: row.post?.title ?? null,
    commentId: row.commentId,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Source de vérité du badge : toujours calculé en base, jamais côté client. */
export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({ where: { recipientId: userId, isRead: false } });
}

export async function listNotifications(
  userId: string,
  options: { filter: NotificationFilter; cursor: string | null; limit: number }
): Promise<{ notifications: NotificationItem[]; nextCursor: string | null }> {
  const rows = await prisma.notification.findMany({
    // Le destinataire est TOUJOURS imposé par la session : impossible de lire
    // les notifications d'un autre utilisateur, même avec un curseur forgé.
    where: { recipientId: userId, ...(options.filter === "unread" ? { isRead: false } : {}) },
    take: options.limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: NOTIFICATION_INCLUDE,
  });

  const hasMore = rows.length > options.limit;
  const page = hasMore ? rows.slice(0, options.limit) : rows;

  return {
    notifications: page.map(serializeNotification),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}