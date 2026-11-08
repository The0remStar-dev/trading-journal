"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/types/post";

export function useCommunityPreview(limit = 3) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch("/api/posts?feed=foryou", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Impossible de charger la communauté.");
        if (active) setPosts((data.posts ?? []).slice(0, limit));
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Impossible de charger la communauté.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [limit]);

  return { posts, loading, error };
}