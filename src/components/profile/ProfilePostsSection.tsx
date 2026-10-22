"use client";

import { Loader2, Users } from "lucide-react";
import { PostCard } from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserPosts } from "@/lib/useUserPosts";

export function ProfilePostsSection({ username }: { username: string }) {
  const { posts, nextCursor, loadingInitial, loadingMore, error, loadMore, removePost, patchPost } =
    useUserPosts(username);

  if (loadingInitial) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-48" />
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
        <EmptyState icon={Users} title="Aucune publication" description="Ce trader n'a encore rien partagé." className="py-12" />
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