type NotificationItem = {
  type: "LIKE" | "COMMENT" | "FOLLOW";
  postTitle: string | null;
  postId: string | null;
  commentId: string | null;
  actor: { username: string };
};

// Fonctions pures (aucun accès base de données, aucun import runtime) :
// partagées par les routes API, les composants et les tests.

/** Clé d'unicité d'un like : une seule notification par (auteur du like, publication). */
export function likeDedupeKey(actorId: string, postId: string): string {
  return `like:${actorId}:${postId}`;
}

/** Clé d'unicité d'un commentaire : une notification par commentaire. */
export function commentDedupeKey(commentId: string): string {
  return `comment:${commentId}`;
}

/** Clé d'unicité d'un follow : une seule notification par paire (suiveur, suivi). */
export function followDedupeKey(actorId: string, recipientId: string): string {
  return `follow:${actorId}:${recipientId}`;
}

/** Texte affiché pour une notification, construit à partir de références (jamais stocké en base). */
export function describeNotification(
  n: Pick<NotificationItem, "type" | "postTitle">
): { verb: string; subject: string | null } {
  if (n.type === "LIKE") return { verb: "a aimé ta publication", subject: n.postTitle };
  if (n.type === "COMMENT") return { verb: "a commenté ta publication", subject: n.postTitle };
  return { verb: "a commencé à te suivre", subject: null };
}

/** Destination d'une notification : profil de l'auteur (follow) ou page de la publication. */
export function getNotificationHref(
  n: Pick<NotificationItem, "type" | "postId" | "commentId" | "actor">
): string {
  if (n.type === "FOLLOW") return `/u/${encodeURIComponent(n.actor.username)}`;
  if (!n.postId) return "/feed"; // garde-fou : ne devrait jamais arriver pour LIKE/COMMENT
  const base = `/posts/${encodeURIComponent(n.postId)}`;
  return n.commentId ? `${base}?comment=${encodeURIComponent(n.commentId)}` : base;
}

/** Libellé du badge de notifications non lues. `null` = pas de badge. Plafonné à "99+". */
export function formatBadgeCount(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? "99+" : String(Math.floor(count));
}

export function truncate(text: string, max: number): string {
  const clean = text.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}