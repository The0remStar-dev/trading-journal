"use client";

import { useCallback, useEffect, useState } from "react";
import type { Post, FeedType } from "@/types/post";

export function useFeed(feedType: FeedType) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts?feed=${feedType}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger le fil d'actualité.");
      const data = await res.json();
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingInitial(false);
    }
  }, [feedType]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts?feed=${feedType}&cursor=${nextCursor}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger plus de publications.");
      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingMore(false);
    }
  }, [feedType, nextCursor, loadingMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  function prependPost(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function removePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function patchPost(postId: string, patch: Partial<Post>) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
  }

  return {
    posts,
    nextCursor,
    loadingInitial,
    loadingMore,
    error,
    loadInitial,
    loadMore,
    prependPost,
    removePost,
    patchPost,
  };
}