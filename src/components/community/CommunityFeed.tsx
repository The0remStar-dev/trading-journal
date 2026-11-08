"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useFeed } from "@/lib/useFeed";
import { Users } from "lucide-react";
import type { FeedType, Post } from "@/types/post";

export function CommunityFeed({ feedType, pendingNewPost }: { feedType: FeedType; pendingNewPost?: Post | null }) {
  const { posts, nextCursor, loadingInitial, loadingMore, error, loadInitial, loadMore, prependPost, removePost, patchPost } =
    useFeed(feedType);
  const [targetPostId, setTargetPostId] = useState<string | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);
  const [targetPost, setTargetPost] = useState<Post | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setTargetPostId(search.get("post"));
    setTargetCommentId(search.get("comment"));

    function handleFocusPost(event: Event) {
      const { postId, commentId } = (event as CustomEvent<{ postId: string; commentId: string | null }>).detail;
      setTargetPostId(postId);
      setTargetCommentId(commentId);
      setTargetPost(null);
      setTargetError(null);
    }

    window.addEventListener("community:focus-post", handleFocusPost);
    return () => window.removeEventListener("community:focus-post", handleFocusPost);
  }, []);

  useEffect(() => {
    if (pendingNewPost) prependPost(pendingNewPost);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNewPost]);

  useEffect(() => {
    if (!targetPostId || loadingInitial || posts.some((post) => post.id === targetPostId)) return;
    let active = true;
    fetch(`/api/posts/${encodeURIComponent(targetPostId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data: { post?: Post; error?: string } = await response.json();
        if (!response.ok || !data.post) throw new Error(data.error ?? "Cette publication n’est plus accessible.");
        if (active) setTargetPost(data.post);
      })
      .catch((cause: unknown) => {
        if (active) setTargetError(cause instanceof Error ? cause.message : "Cette publication n’est plus accessible.");
      });
    return () => {
      active = false;
    };
  }, [loadingInitial, posts, targetPostId]);

  useEffect(() => {
    if (!targetPostId || loadingInitial) return;
    if (posts.some((post) => post.id === targetPostId) || targetPost?.id === targetPostId) {
      document.getElementById(`post-${targetPostId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loadingInitial, posts, targetPost, targetPostId]);

  function handlePatch(postId: string, patch: Partial<Post>) {
    patchPost(postId, patch);
    setTargetPost((current) => current?.id === postId ? { ...current, ...patch } : current);
  }

  function handleDelete(postId: string) {
    removePost(postId);
    setTargetPost((current) => current?.id === postId ? null : current);
  }

  if (loadingInitial) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">{error}</div>;
  }

  const visiblePosts = targetPost && !posts.some((post) => post.id === targetPost.id)
    ? [targetPost, ...posts]
    : posts;

  if (visiblePosts.length === 0) {
    return (
      <>
        {targetError && (
          <p role="status" className="mb-4 rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
            {targetError}
          </p>
        )}
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState icon={Users} title="Aucune publication" description="Rien à afficher sur cet onglet pour le moment." className="py-16" />
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {targetError && (
        <p role="status" className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
          {targetError}
        </p>
      )}
      {visiblePosts.map((post) => (
        <div key={post.id} id={`post-${post.id}`} className="scroll-mt-20">
          <PostCard
            post={post}
            onDelete={handleDelete}
            onPatch={handlePatch}
            initialCommentId={post.id === targetPostId ? targetCommentId : null}
          />
        </div>
      ))}

      {nextCursor && (
        <div className="flex justify-center py-2">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Charger plus"}
          </Button>
        </div>
      )}
    </div>
  );
}