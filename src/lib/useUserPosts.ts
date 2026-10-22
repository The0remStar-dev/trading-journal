"use client";

import { useCallback, useEffect, useState } from "react";
import type { Post } from "@/types/post";

export function useUserPosts(username: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/users/${encodeURIComponent(username)}/posts`;

  const loadInitial = useCallback(async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const res = await fetch(base, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger les publications.");
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingInitial(false);
    }
  }, [base]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`${base}?cursor=${nextCursor}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger plus de publications.");
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingMore(false);
    }
  }, [base, nextCursor, loadingMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  function removePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function patchPost(postId: string, patch: Partial<Post>) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
  }

  return { posts, nextCursor, loadingInitial, loadingMore, error, loadMore, removePost, patchPost };
}