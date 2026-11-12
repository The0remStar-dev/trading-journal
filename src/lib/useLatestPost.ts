"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import type { Post } from "@/types/post";

export function useLatestPost() {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const likeBusy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<{ post: Post | null }>("/api/community/latest");
      setPost(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la publication.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Like optimiste avec retour arrière si le serveur échoue. */
  const toggleLike = useCallback(async () => {
    if (!post || likeBusy.current) return;
    likeBusy.current = true;
    setActionError(null);

    const wantsLike = !post.isLikedByViewer;
    const before = { isLikedByViewer: post.isLikedByViewer, likeCount: post.likeCount };

    setPost((p) =>
      p ? { ...p, isLikedByViewer: wantsLike, likeCount: Math.max(0, p.likeCount + (wantsLike ? 1 : -1)) } : p
    );

    try {
      const data = await fetchJson<{ liked: boolean; likeCount: number }>(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ like: wantsLike }),
      });
      setPost((p) => (p ? { ...p, isLikedByViewer: data.liked, likeCount: data.likeCount } : p));
    } catch (err) {
      setPost((p) => (p ? { ...p, ...before } : p));
      setActionError(err instanceof Error ? err.message : "Impossible d'enregistrer le like.");
    } finally {
      likeBusy.current = false;
    }
  }, [post]);

  return { post, loading, error, actionError, toggleLike, reload: load };
}