"use client";

import { useCallback, useState } from "react";
import type { Post } from "@/types/post";

export function usePostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger le fil d'actualité.");
      const data = await res.json();
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?cursor=${nextCursor}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger plus de publications.");
      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  const prependPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return { posts, nextCursor, loadingInitial, loadingMore, error, loadInitial, loadMore, prependPost };
}