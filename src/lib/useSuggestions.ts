"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import type { SuggestedProfile, SuggestionsResponse } from "@/types/notification";

export function useSuggestions(limit: number) {
  const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const [busy, setBusy] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Garde synchrone contre les clics répétés (le state React est asynchrone).
  const busyRef = useRef<Set<string>>(new Set());
  const timers = useRef<number[]>([]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await fetchJson<SuggestionsResponse>(`/api/community/suggestions?limit=${limit}`);
        setSuggestions(data.suggestions);
        setFollowed([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger les suggestions.");
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    load();
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, [load]);

  const follow = useCallback(
    async (username: string) => {
      if (busyRef.current.has(username)) return;
      busyRef.current.add(username);
      setBusy(Array.from(busyRef.current));
      setActionError(null);

      try {
        // État souhaité explicite : un clic répété ne peut jamais "désuivre".
        const data = await fetchJson<{ isFollowing: boolean }>(
          `/api/users/${encodeURIComponent(username)}/follow`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ follow: true }),
          }
        );

        if (data.isFollowing) {
          setFollowed((prev) => [...prev, username]);
          // Laisse voir « Suivi », puis recharge : le compte suivi disparaît
          // des suggestions et un autre profil peut prendre sa place.
          timers.current.push(window.setTimeout(() => void load(true), 900));
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Impossible de suivre ce compte.");
      } finally {
        busyRef.current.delete(username);
        setBusy(Array.from(busyRef.current));
      }
    },
    [load]
  );

  return { suggestions, followed, busy, loading, error, actionError, follow, reload: load };
}