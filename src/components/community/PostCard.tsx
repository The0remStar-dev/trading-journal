"use client";

import { useState } from "react";
import { Bookmark, Camera, Heart, MessageCircle, Trash2, User, UserRoundCheck, UserRoundPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommentSection } from "@/components/community/CommentSection";
import { ReportPostButton } from "@/components/community/ReportpostButton";
import { DirectionBadge } from "@/components/trades/StatusBadge";
import { useToast } from "@/lib/useToast";
import { cn } from "@/lib/utils";
import { EMOTION_LABELS } from "@/types/trade";
import { EXPERIENCE_LEVEL_LABELS } from "@/types/profile";
import { POST_TYPE_LABELS } from "@/types/post";
import type { Post } from "@/types/post";

interface PostCardProps {
  post: Post;
  onDelete: (postId: string) => void;
  onPatch: (postId: string, patch: Partial<Post>) => void;
}

function timeAgo(value: string): string {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function PostCard({ post, onDelete, onPatch }: PostCardProps) {
  const { toast } = useToast();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleReaction(action: "like" | "save") {
    setBusy(action);
    try {
      const response = await fetch(`/api/posts/${post.id}/${action}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Action impossible.");
      onPatch(post.id, action === "like"
        ? { isLikedByViewer: data.liked, likeCount: data.likeCount }
        : { isSavedByViewer: data.saved, saveCount: data.saveCount });
    } catch (error) {
      toast({
        title: "Action impossible",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function toggleFollow() {
    setBusy("follow");
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(post.author.username)}/follow`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de modifier le suivi.");
      onPatch(post.id, { isFollowingAuthor: data.isFollowing });
    } catch (error) {
      toast({
        title: "Suivi impossible",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function deletePost() {
    if (!window.confirm("Supprimer cette publication ?")) return;
    setBusy("delete");
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Suppression impossible.");
      onDelete(post.id);
    } catch (error) {
      toast({
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
              {post.author.avatarUrl ? (
                <img src={post.author.avatarUrl} alt={post.author.username} className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-muted" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{post.author.username}</p>
              <p className="text-xs text-muted">
                {EXPERIENCE_LEVEL_LABELS[post.author.experienceLevel]} · {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!post.isOwnPost && (
              <Button variant="ghost" size="icon" onClick={toggleFollow} disabled={busy !== null}
                title={post.isFollowingAuthor ? "Ne plus suivre" : "Suivre"}
                aria-label={post.isFollowingAuthor ? "Ne plus suivre" : "Suivre"}>
                {post.isFollowingAuthor ? <UserRoundCheck className="h-4 w-4" /> : <UserRoundPlus className="h-4 w-4" />}
              </Button>
            )}
            {post.isOwnPost ? (
              <Button variant="ghost" size="icon" onClick={deletePost} disabled={busy !== null} title="Supprimer" aria-label="Supprimer">
                <Trash2 className="h-4 w-4 text-loss" />
              </Button>
            ) : (
              <ReportPostButton postId={post.id} />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="tag">{POST_TYPE_LABELS[post.type]}</Badge>
          <Badge variant="neutral">{EMOTION_LABELS[post.emotion]}</Badge>
          {post.symbol && <Badge variant="tag">{post.symbol}</Badge>}
          {post.direction && <DirectionBadge direction={post.direction} />}
          {post.rMultiple !== null && (
            <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", post.rMultiple >= 0
              ? "border-win/30 bg-win-dim text-win"
              : "border-loss/30 bg-loss-dim text-loss")}>
              {post.rMultiple >= 0 ? "+" : ""}{post.rMultiple.toFixed(2)}R
            </span>
          )}
        </div>

        <h2 className="mt-3 text-base font-semibold text-foreground">{post.title}</h2>

        {(post.mistakeSummary || post.lessonLearned || post.body) && (
          <div className="mt-3 flex flex-col gap-3 text-sm text-textSecondary">
            {post.mistakeSummary && <p className="whitespace-pre-wrap">{post.mistakeSummary}</p>}
            {post.lessonLearned && <p className="whitespace-pre-wrap">{post.lessonLearned}</p>}
            {post.body && <p className="whitespace-pre-wrap">{post.body}</p>}
          </div>
        )}

        {(post.beforeImageUrl || post.afterImageUrl) ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {post.beforeImageUrl && <img src={post.beforeImageUrl} alt="Graphique avant" className="h-48 w-full rounded-md border border-border object-cover" />}
            {post.afterImageUrl && <img src={post.afterImageUrl} alt="Graphique après" className="h-48 w-full rounded-md border border-border object-cover" />}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
            <Camera className="h-3.5 w-3.5" /> Aucun graphique joint
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button variant={post.isLikedByViewer ? "subtle" : "ghost"} size="sm" onClick={() => toggleReaction("like")} disabled={busy !== null}>
            <Heart className={cn("h-4 w-4", post.isLikedByViewer && "fill-current text-loss")} />
            {post.likeCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCommentsOpen((open) => !open)}>
            <MessageCircle className="h-4 w-4" /> {post.commentCount}
          </Button>
          <Button variant={post.isSavedByViewer ? "subtle" : "ghost"} size="sm" onClick={() => toggleReaction("save")} disabled={busy !== null}>
            <Bookmark className={cn("h-4 w-4", post.isSavedByViewer && "fill-current")} />
            {post.saveCount}
          </Button>
        </div>

        {commentsOpen && (
          <div className="mt-3">
            <CommentSection postId={post.id} onCountChange={(commentCount) => onPatch(post.id, { commentCount })} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}