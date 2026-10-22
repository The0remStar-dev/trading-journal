"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicProfileResponse } from "@/types/publicProfile";

export function usePublicProfile(username: string) {
  const [data, setData] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // silent = true : rafraîchit sans repasser par l'écran de chargement
  // (utilisé après un follow/unfollow, qui peut débloquer du contenu).
  const fetchProfile = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}`, { cache: "no-store" });
        if (res.status === 404) {
          setNotFound(true);
          setData(null);
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Impossible de charger ce profil.");
        }
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [username]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { data, loading, error, notFound, refetch: fetchProfile };
}