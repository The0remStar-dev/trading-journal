"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Bookmark, User, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DirectionBadge } from "@/components/trades/StatusBadge";
import { CommentSection } from "@/components/community/CommentSection";
import { ReportPostButton } from "@/components/community/ReportpostButton";
import { EMOTION_LABELS } from "@/types/trade";
import { POST_TYPE_LABELS } from "@/types/post";
import { EXPERIENCE_LEVEL_LABELS } from "@/types/profile";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/useToast";
import type { Post } from "@/types/post";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onPatch?: (postId: string, patch: Partial<Post>) => void;
  initialCommentId?: string | null;
}

export function PostCard({ post, onDelete, onPatch, initialCommentId }: PostCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(Boolean(initialCommentId));
  const [followBusy, setFollowBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialCommentId) setCommentsOpen(true);
  }, [initialCommentId]);

  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !post.isLikedByViewer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de modifier le like.");
      onPatch?.(post.id, { isLikedByViewer: data.liked, likeCount: data.likeCount });
    } catch (error) {
      toast({
        title: "Action impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue.",
        variant: "error",
      });
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleSave() {
    const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      onPatch?.(post.id, { isSavedByViewer: data.saved, saveCount: data.saveCount });
    }
  }

  async function toggleFollow() {
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(post.author.username)}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFollowing: !post.isFollowingAuthor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de modifier le suivi.");
      onPatch?.(post.id, { isFollowingAuthor: data.isFollowing });
    } catch (error) {
      toast({
        title: "Action impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue.",
        variant: "error",
      });
    } finally {
      setFollowBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement cette publication ?")) return;
    setDeleteBusy(true);
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) onDelete?.(post.id);
    setDeleteBusy(false);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/u/${encodeURIComponent(post.author.username)}`}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
              {post.author.avatarUrl ? (
                <img src={post.author.avatarUrl} alt={post.author.username} className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-muted" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{post.author.username}</span>
              <span className="text-xs text-muted">
                {EXPERIENCE_LEVEL_LABELS[post.author.experienceLevel]} · {timeAgo(post.createdAt)}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {!post.isOwnPost && (
              <Button
                size="sm"
                variant={post.isFollowingAuthor ? "outline" : "subtle"}
                className="h-7 px-2.5 text-xs"
                onClick={toggleFollow}
                disabled={followBusy}
              >
                {post.isFollowingAuthor ? "Suivi" : "Suivre"}
              </Button>
            )}
            {post.isOwnPost && (
              <button onClick={handleDelete} disabled={deleteBusy} className="text-muted hover:text-loss">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {!post.isOwnPost && <ReportPostButton postId={post.id} />}
          </div>
        </div>

        <div className="mb-1 flex items-center gap-2">
          <Badge variant="tag">{POST_TYPE_LABELS[post.type]}</Badge>
          <h3 className="text-base font-semibold text-foreground">{post.title}</h3>
        </div>

        {post.symbol && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="tag">{post.symbol}</Badge>
            {post.direction && <DirectionBadge direction={post.direction} />}
            {post.rMultiple !== null && (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-semibold",
                  post.rMultiple >= 0 ? "border-win/30 bg-win-dim text-win" : "border-loss/30 bg-loss-dim text-loss"
                )}
              >
                {post.rMultiple >= 0 ? "+" : ""}
                {post.rMultiple.toFixed(2)}R
              </span>
            )}
            <Badge variant="neutral">{EMOTION_LABELS[post.emotion]}</Badge>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 text-sm">
          {post.mistakeSummary && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Résumé de l&apos;erreur</p>
              <p className="mt-1 text-textSecondary">{post.mistakeSummary}</p>
            </div>
          )}
          {post.lessonLearned && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Leçon apprise</p>
              <p className="mt-1 text-textSecondary">{post.lessonLearned}</p>
            </div>
          )}
          {post.body && <p className="text-textSecondary">{post.body}</p>}
        </div>

        {(post.beforeImageUrl || post.afterImageUrl) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {post.beforeImageUrl && (
              <div className="overflow-hidden rounded-md border border-border">
                <img src={post.beforeImageUrl} alt="Avant" className="h-40 w-full object-cover" />
              </div>
            )}
            {post.afterImageUrl && (
              <div className="overflow-hidden rounded-md border border-border">
                <img src={post.afterImageUrl} alt="Après" className="h-40 w-full object-cover" />
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
          <button
            onClick={toggleLike}
            disabled={likeBusy}
            aria-pressed={post.isLikedByViewer}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-loss disabled:opacity-60"
          >
            <Heart className={cn("h-4 w-4", post.isLikedByViewer && "fill-loss text-loss")} />
            {post.likeCount}
          </button>
          <button
            onClick={() => setCommentsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-accent"
          >
            <MessageCircle className="h-4 w-4" />
            {post.commentCount}
          </button>
          <button onClick={toggleSave} className="flex items-center gap-1.5 text-sm text-muted hover:text-accent">
            <Bookmark className={cn("h-4 w-4", post.isSavedByViewer && "fill-accent text-accent")} />
            {post.saveCount}
          </button>
        </div>

        {commentsOpen && (
          <div className="mt-3">
            <CommentSection
              postId={post.id}
              focusCommentId={initialCommentId}
              onCountChange={(count) => onPatch?.(post.id, { commentCount: count })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}