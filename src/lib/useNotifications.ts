"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { notifyNotificationsChanged } from "@/lib/notifications/events";
import type { NotificationItem, NotificationListResponse } from "@/types/notification";

type NotificationFilter = "all" | "unread" | "read";

interface Options {
  filter?: NotificationFilter;
  limit?: number;
}

export function useNotifications({ filter = "all", limit = 15 }: Options = {}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const requestId = useRef(0);
  const itemsRef = useRef<NotificationItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<NotificationListResponse>(`/api/notifications?filter=${filter}&limit=${limit}`);
      if (current !== requestId.current) return; // réponse obsolète (changement de filtre entre-temps)
      setItems(data.notifications);
      setNextCursor(data.nextCursor);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      if (current !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Impossible de charger les notifications.");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [filter, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchJson<NotificationListResponse>(
        `/api/notifications?filter=${filter}&limit=${limit}&cursor=${encodeURIComponent(nextCursor)}`
      );
      setItems((prev) => {
        const known = new Set(prev.map((n) => n.id));
        return [...prev, ...data.notifications.filter((n) => !known.has(n.id))];
      });
      setNextCursor(data.nextCursor);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Impossible de charger la suite.");
    } finally {
      setLoadingMore(false);
    }
  }, [filter, limit, nextCursor, loadingMore]);

  /** Marque une notification comme lue (optimiste, annulée si le serveur refuse). Ne lève jamais d'exception. */
  const markRead = useCallback(async (id: string) => {
    const target = itemsRef.current.find((n) => n.id === id);
    if (!target || target.isRead) return;

    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const data = await fetchJson<{ unreadCount: number }>(`/api/notifications/${id}/read`, { method: "POST" });
      setUnreadCount(data.unreadCount); // le serveur reste la source de vérité
      notifyNotificationsChanged();
    } catch (err) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      setUnreadCount((c) => c + 1);
      setActionError(err instanceof Error ? err.message : "Impossible de marquer comme lue.");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    const snapshot = { items, nextCursor, unreadCount };

    if (filter === "unread") {
      setItems([]);
      setNextCursor(null);
    } else {
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
    setUnreadCount(0);

    try {
      await fetchJson("/api/notifications/read-all", { method: "POST" });
      notifyNotificationsChanged();
    } catch (err) {
      setItems(snapshot.items);
      setNextCursor(snapshot.nextCursor);
      setUnreadCount(snapshot.unreadCount);
      setActionError(err instanceof Error ? err.message : "Impossible de tout marquer comme lu.");
    }
  }, [filter, items, nextCursor, unreadCount]);

  return {
    items,
    unreadCount,
    loading,
    loadingMore,
    error,
    actionError,
    hasMore: nextCursor !== null,
    reload: load,
    loadMore,
    markRead,
    markAllRead,
    clearActionError: () => setActionError(null),
  };
}