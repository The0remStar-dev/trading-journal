"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, MessageCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsPanel } from "@/components/community/NotificationsPanel";
import { ProfileSuggestions } from "@/components/community/ProfileSuggestions";
import { useCommunityPreview } from "@/lib/useCommunityPreview";
import { useNotificationCount } from "@/lib/useNotificationCount";
import { useToast } from "@/lib/useToast";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/post";

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

export function CommunityPreview() {
  const { posts, loading, error } = useCommunityPreview(1);
  const [post, setPost] = useState<Post | null>(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const unreadCount = useNotificationCount();
  const { toast } = useToast();

  useEffect(() => {
    setPost(posts[0] ?? null);
  }, [posts]);

  async function toggleLike() {
    if (!post || likeBusy) return;
    setLikeBusy(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !post.isLikedByViewer }),
      });
      const data: { liked: boolean; likeCount: number; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de modifier le like.");
      setPost({ ...post, isLikedByViewer: data.liked, likeCount: data.likeCount });
    } catch (cause) {
      toast({
        title: "Action impossible",
        description: cause instanceof Error ? cause.message : "Erreur inconnue.",
        variant: "error",
      });
    } finally {
      setLikeBusy(false);
    }
  }

  const postText = post?.body || post?.lessonLearned || post?.mistakeSummary || post?.title;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-muted" />
              Communauté
              {unreadCount > 0 && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  {unreadCount > 99 ? "99+" : unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </CardTitle>
            <p className="mt-1 text-xs text-muted">Apprends des autres traders et partage ta progression.</p>
          </div>
          <Link href="/feed" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline">
            Voir la communauté <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <section aria-label="Dernière publication">
          <h4 className="mb-2 text-xs font-semibold text-foreground">Dernière publication</h4>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : error ? (
            <p role="alert" className="rounded-md bg-loss-dim px-3 py-2 text-xs text-loss">{error}</p>
          ) : post ? (
            <div className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <Link href={`/u/${encodeURIComponent(post.author.username)}`}>
                  <Avatar src={post.author.avatarUrl} alt={post.author.username} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${encodeURIComponent(post.author.username)}`} className="block truncate text-xs font-medium text-foreground hover:text-accent">
                    {post.author.username}
                  </Link>
                  <span className="text-[10px] text-muted">{timeAgo(post.createdAt)}</span>
                </div>
                <Link href={`/feed?post=${encodeURIComponent(post.id)}#post-${encodeURIComponent(post.id)}`} className="text-xs text-accent hover:underline">
                  Ouvrir
                </Link>
              </div>
              <Link
                href={`/feed?post=${encodeURIComponent(post.id)}#post-${encodeURIComponent(post.id)}`}
                className="mt-2 block"
              >
                <p className="text-sm font-medium text-foreground">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-textSecondary">{postText}</p>
              </Link>
              {post.beforeImageUrl && (
                <Image
                  src={post.beforeImageUrl}
                  alt=""
                  width={640}
                  height={360}
                  unoptimized
                  className="mt-2 max-h-32 w-full rounded-md object-cover"
                />
              )}
              <div className="mt-2 flex items-center gap-3 border-t border-border pt-2">
                <button
                  type="button"
                  aria-pressed={post.isLikedByViewer}
                  onClick={() => void toggleLike()}
                  disabled={likeBusy}
                  className="flex items-center gap-1 text-xs text-muted hover:text-loss disabled:opacity-60"
                >
                  <Heart className={cn("h-3.5 w-3.5", post.isLikedByViewer && "fill-loss text-loss")} />
                  {post.likeCount}
                </button>
                <Link
                  href={`/feed?post=${encodeURIComponent(post.id)}#post-${encodeURIComponent(post.id)}`}
                  className="flex items-center gap-1 text-xs text-muted hover:text-accent"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.commentCount}
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Pas encore de publication"
              description="Découvre la communauté ou partage ta première leçon."
              className="rounded-md border border-border bg-background py-5"
            />
          )}
        </section>

        <div className="border-t border-border pt-3">
          <NotificationsPanel compact />
        </div>

        <div className="border-t border-border pt-3">
          <ProfileSuggestions compact limit={2} />
        </div>
      </CardContent>
    </Card>
  );
}
