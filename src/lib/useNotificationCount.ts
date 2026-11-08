"use client";

import { useCallback, useEffect, useState } from "react";

export function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?limit=1", { cache: "no-store" });
      if (!response.ok) throw new Error("Impossible de charger le compteur de notifications.");
      const data: { unreadCount: number } = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Erreur lors du chargement du compteur de notifications :", error);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("notifications:updated", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("notifications:updated", refresh);
    };
  }, [refresh]);

  return unreadCount;
}
