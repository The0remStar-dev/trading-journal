"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notifications/events";

/**
 * Compteur de notifications non lues pour la navigation.
 * Pas d'infrastructure temps réel : rafraîchi à l'ouverture, au retour de
 * focus, après une action de lecture, puis toutes les 60 s si l'onglet est visible.
 */
export function useUnreadCount(pollMs = 60_000) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJson<{ unreadCount: number }>("/api/notifications/unread-count");
      setCount(data.unreadCount);
    } catch {
      // Silencieux : un badge ne doit jamais casser ni polluer la page.
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, pollMs);

    window.addEventListener("focus", refresh);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [refresh, pollMs]);

  return { count, refresh };
}