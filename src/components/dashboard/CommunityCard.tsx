"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationRow } from "@/components/community/NotificationRow";
import { SuggestionRow } from "@/components/community/SuggestionRow";
import { LatestPostPreview } from "@/components/dashboard/LatestPostPreview";
import { useLatestPost } from "@/lib/useLatestPost";
import { useNotifications } from "@/lib/useNotifications";
import { useSuggestions } from "@/lib/useSuggestions";
import { getNotificationHref } from "@/lib/notifications/helpers";
import type { NotificationItem } from "@/types/notification";

export function CommunityCard() {
  const router = useRouter();
  const latest = useLatestPost();
  const notifications = useNotifications({ limit: 3 });
  const suggestions = useSuggestions(2);

  // Ordre voulu : 1) marquer lu côté serveur, 2) mettre l'UI à jour, 3) naviguer.
  async function openNotification(n: NotificationItem) {
    await notifications.markRead(n.id);
    router.push(getNotificationHref(n));
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-textSecondary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-foreground">Communauté</h2>
                {notifications.unreadCount > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {notifications.unreadCount > 99 ? "99+" : notifications.unreadCount} non lue
                    {notifications.unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted">Apprends des autres traders et partage ta progression.</p>
            </div>
          </div>
          <Button asChild variant="subtle" size="sm">
            <Link href="/feed">Voir la communauté</Link>
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Dernière publication */}
          <div className="lg:col-span-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Dernière publication</p>

            {latest.loading ? (
              <Skeleton className="h-56 w-full" />
            ) : latest.error ? (
              <div className="flex flex-col items-start gap-2 rounded-md border border-loss/30 bg-loss-dim px-3 py-3 text-sm text-loss">
                {latest.error}
                <Button size="sm" variant="outline" onClick={latest.reload}>
                  Réessayer
                </Button>
              </div>
            ) : latest.post ? (
              <>
                <LatestPostPreview post={latest.post} onToggleLike={latest.toggleLike} />
                {latest.actionError && <p className="mt-2 text-xs text-loss">{latest.actionError}</p>}
              </>
            ) : (
              <div className="rounded-md border border-dashed border-border">
                <EmptyState
                  icon={Users}
                  title="Aucune publication pour l'instant"
                  description="Découvre la communauté ou partage ta première leçon."
                  className="py-10"
                />
                <div className="flex justify-center pb-6">
                  <Button asChild size="sm">
                    <Link href="/feed">Ouvrir la communauté</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications + suggestions */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Notifications</p>
                <Link href="/feed?panel=notifications" className="text-xs font-medium text-accent hover:underline">
                  Tout voir
                </Link>
              </div>

              {notifications.loading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : notifications.error ? (
                <p className="text-sm text-loss">{notifications.error}</p>
              ) : notifications.items.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="Tu es à jour"
                  description="Les nouvelles interactions apparaîtront ici."
                  className="py-6"
                />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {notifications.items.map((n) => (
                    <NotificationRow key={n.id} notification={n} onOpen={openNotification} />
                  ))}
                </div>
              )}
              {notifications.actionError && <p className="mt-2 text-xs text-loss">{notifications.actionError}</p>}
            </div>

            {/* Masqué s'il n'y a rien à proposer : on ne surcharge pas le dashboard. */}
            {!suggestions.loading && suggestions.suggestions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">À découvrir</p>
                <div className="flex flex-col gap-3">
                  {suggestions.suggestions.map((profile) => {
                    const username = profile.username;
                    if (!username) return null;

                    return (
                      <SuggestionRow
                        key={username}
                        profile={profile as unknown as ComponentProps<typeof SuggestionRow>["profile"]}
                        followed={suggestions.followed.includes(username)}
                        busy={suggestions.busy.includes(username)}
                        onFollow={suggestions.follow}
                      />
                    );
                  })}
                </div>
                {suggestions.actionError && <p className="mt-2 text-xs text-loss">{suggestions.actionError}</p>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}