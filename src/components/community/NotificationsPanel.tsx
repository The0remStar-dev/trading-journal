"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationRow } from "@/components/community/NotificationRow";
import { cn } from "@/lib/utils";
import type { NotificationFilter, NotificationItem } from "@/types/notification";

// Au-delà de ce nombre, « Tout marquer comme lu » demande une confirmation.
const CONFIRM_THRESHOLD = 10;

interface NotificationsPanelProps {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  actionError: string | null;
  hasMore: boolean;
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  onLoadMore: () => void;
  onOpen: (notification: NotificationItem) => void;
  onMarkAllRead: () => void;
  onRetry: () => void;
  onBrowseFeed?: () => void;
}

export function NotificationsPanel({
  items,
  unreadCount,
  loading,
  loadingMore,
  error,
  actionError,
  hasMore,
  filter,
  onFilterChange,
  onLoadMore,
  onOpen,
  onMarkAllRead,
  onRetry,
  onBrowseFeed,
}: NotificationsPanelProps) {
  function handleMarkAll() {
    if (
      unreadCount > CONFIRM_THRESHOLD &&
      !window.confirm(`Marquer les ${unreadCount} notifications non lues comme lues ?`)
    ) {
      return;
    }
    onMarkAllRead();
  }

  return (
    <Card id="notifications-panel" className="scroll-mt-6">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-medium text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-textSecondary"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tout marquer comme lu
          </Button>
        </div>

        <div className="mb-3 flex gap-1 rounded-md bg-secondary p-1">
          {(["all", "unread"] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "primary" : "ghost"}
              className={cn("h-7 flex-1 text-xs", filter !== value && "text-textSecondary")}
              onClick={() => onFilterChange(value)}
            >
              {value === "all" ? "Toutes" : "Non lues"}
            </Button>
          ))}
        </div>

        {actionError && (
          <p className="mb-2 rounded-md border border-loss/30 bg-loss-dim px-3 py-2 text-xs text-loss">{actionError}</p>
        )}

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-start gap-2 rounded-md border border-loss/30 bg-loss-dim px-3 py-3 text-sm text-loss">
            {error}
            <Button size="sm" variant="outline" onClick={onRetry}>
              Réessayer
            </Button>
          </div>
        ) : items.length === 0 ? (
          filter === "unread" ? (
            <EmptyState icon={CheckCheck} title="Tu es à jour" description="Aucune notification non lue." className="py-8" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <EmptyState
                icon={Bell}
                title="Aucune notification"
                description="Les likes, commentaires et nouveaux abonnés apparaîtront ici."
                className="py-2"
              />
              {onBrowseFeed && (
                <Button size="sm" variant="outline" onClick={onBrowseFeed}>
                  Voir les publications
                </Button>
              )}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-0.5">
            {items.map((n) => (
              <NotificationRow key={n.id} notification={n} onOpen={onOpen} />
            ))}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button size="sm" variant="outline" onClick={onLoadMore} disabled={loadingMore}>
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Charger plus"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}