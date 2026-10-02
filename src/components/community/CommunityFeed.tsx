"use client";

import { useEffect } from "react";
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
    return <div className="rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState icon={Users} title="Aucune publication" description="Rien à afficher sur cet onglet pour le moment." className="py-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={removePost} onPatch={patchPost} />
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