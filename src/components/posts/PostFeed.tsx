"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { usePostFeed } from "@/lib/usePostFeed";
import type { Post } from "@/types/post";

interface PostFeedProps {
  /** Post ajouté juste après publication, affiché immédiatement sans refetch. */
  pendingNewPost?: Post | null;
}

export function PostFeed({ pendingNewPost }: PostFeedProps) {
  const { posts, nextCursor, loadingInitial, loadingMore, error, loadInitial, loadMore, prependPost } =
    usePostFeed();

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (pendingNewPost) prependPost(pendingNewPost);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNewPost]);

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
    return (
      <div className="rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface text-center">
        <p className="text-sm text-muted">Aucune publication pour l'instant.</p>
        <p className="text-xs text-muted">Soyez le premier à partager une leçon avec la communauté.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
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