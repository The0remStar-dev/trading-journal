"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CommunityNotification } from "@/types/notification";

interface NotificationResponse {
  notifications: CommunityNotification[];
  unreadCount: number;
  nextCursor: string | null;
}

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `il y a ${days} j` : new Date(iso).toLocaleDateString("fr-FR");
}

function description(notification: CommunityNotification) {
  if (notification.type === "LIKE") return "a aimé ta publication.";
  if (notification.type === "COMMENT") return "a commenté ta publication.";
  return "a commencé à te suivre.";
}

export function NotificationsPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);

  const loadNotifications = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      if (reset) cursorRef.current = null;
      const cursorQuery = !reset && cursorRef.current ? `&cursor=${encodeURIComponent(cursorRef.current)}` : "";
      const response = await fetch(
        `/api/notifications?limit=${compact ? 3 : 20}&unreadOnly=${unreadOnly}${cursorQuery}`,
        { cache: "no-store" }
      );
      const data: NotificationResponse & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de charger les notifications.");
      setNotifications((current) => reset ? data.notifications : [...current, ...data.notifications]);
      setUnreadCount(data.unreadCount);
      cursorRef.current = data.nextCursor;
      setNextCursor(data.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [compact, unreadOnly]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function openNotification(notification: CommunityNotification) {
    setBusyId(notification.id);
    setError(null);
    try {
      const response = await fetch(`/api/notifications/${notification.id}/read`, { method: "POST" });
      const data: { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible d’ouvrir cette notification.");
      setNotifications((items) => unreadOnly
        ? items.filter((item) => item.id !== notification.id)
        : items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      if (!notification.isRead) setUnreadCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event("notifications:updated"));
      if (notification.postId) {
        window.dispatchEvent(new CustomEvent("community:focus-post", {
          detail: { postId: notification.postId, commentId: notification.commentId },
        }));
      }
      router.push(notification.targetHref);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’ouvrir cette notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    if (markingAll || unreadCount === 0) return;
    if (unreadCount > 20 && !window.confirm(`Marquer ${unreadCount} notifications comme lues ?`)) return;
    setMarkingAll(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications/read-all", { method: "POST" });
      const data: { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de marquer les notifications comme lues.");
      setNotifications((items) => unreadOnly ? [] : items.map((item) => ({ ...item, isRead: true })));
      if (unreadOnly) {
        cursorRef.current = null;
        setNextCursor(null);
      }
      setUnreadCount(0);
      window.dispatchEvent(new Event("notifications:updated"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de marquer les notifications comme lues.");
    } finally {
      setMarkingAll(false);
    }
  }

  const content = (
    <>
      {!compact && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUnreadOnly(false)}
              className={cn("rounded-md px-2.5 py-1 text-xs", !unreadOnly ? "bg-secondary text-foreground" : "text-muted hover:bg-secondary")}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setUnreadOnly(true)}
              className={cn("rounded-md px-2.5 py-1 text-xs", unreadOnly ? "bg-secondary text-foreground" : "text-muted hover:bg-secondary")}
            >
              Non lues
            </button>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50"
          >
            {markingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Tout marquer comme lu
          </button>
        </div>
      )}

      {error && <p role="alert" className="mb-3 rounded-md bg-loss-dim px-3 py-2 text-xs text-loss">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="sr-only">Chargement des notifications</span>
        </div>
      ) : notifications.length === 0 && !error ? (
        <div className="rounded-md border border-border bg-background px-3 py-4 text-center">
          <p className="text-sm font-medium text-foreground">Tu es à jour.</p>
          <p className="mt-1 text-xs text-muted">Les likes, commentaires et nouveaux abonnés apparaîtront ici.</p>
          {compact && <Link href="/feed" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">Découvrir la communauté</Link>}
        </div>
      ) : notifications.length > 0 ? (
        <div className="flex flex-col divide-y divide-border">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void openNotification(notification)}
              disabled={busyId === notification.id}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-secondary disabled:opacity-60",
                !notification.isRead && "bg-accent/5"
              )}
            >
              <Avatar src={notification.actor.avatarUrl} alt={notification.actor.username} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs leading-5 text-textSecondary">
                  <strong className="font-medium text-foreground">{notification.actor.username}</strong>{" "}
                  {description(notification)}
                </span>
                <span className="mt-0.5 block text-[10px] text-muted">{timeAgo(notification.createdAt)}</span>
              </span>
              {!notification.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Non lue" />}
              {busyId === notification.id && <Loader2 className="mt-1 h-3.5 w-3.5 animate-spin text-muted" />}
            </button>
          ))}
        </div>
      ) : null}

      {nextCursor && !compact && (
        <button
          type="button"
          onClick={() => void loadNotifications(false)}
          disabled={loadingMore}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-xs text-muted hover:bg-secondary disabled:opacity-60"
        >
          {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Charger plus
        </button>
      )}

      {compact && (
        <Link href="/feed#notifications" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
          Voir toutes les notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Link>
      )}
    </>
  );

  if (compact) {
    return (
      <section aria-label="Notifications récentes">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Bell className="h-3.5 w-3.5 text-muted" />
            Notifications
          </h4>
          {unreadCount > 0 && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">{unreadCount > 99 ? "99+" : unreadCount} non lues</span>}
        </div>
        {content}
      </section>
    );
  }

  return (
    <Card id="notifications">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-4 w-4 text-muted" /> Notifications
          </CardTitle>
          {unreadCount > 0 && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{unreadCount > 99 ? "99+" : unreadCount} non lues</span>}
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
