/**
 * Temps écoulé en français. `now` est injectable pour rendre la fonction testable.
 */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const diffMs = now - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return "";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}