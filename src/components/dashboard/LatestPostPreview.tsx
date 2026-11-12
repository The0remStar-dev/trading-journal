"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Heart, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DirectionBadge } from "@/components/trades/StatusBadge";
import { POST_TYPE_LABELS } from "@/types/post";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/post";

const EXPAND_THRESHOLD = 180;

function buildPreviewText(post: Post): string {
  return [post.body, post.mistakeSummary, post.lessonLearned]
    .filter((part): part is string => !!part && part.trim().length > 0)
    .join("\n\n");
}

export function LatestPostPreview({ post, onToggleLike }: { post: Post; onToggleLike: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);

  const text = buildPreviewText(post);
  const canExpand = text.length > EXPAND_THRESHOLD;
  const image = post.beforeImageUrl ?? post.afterImageUrl;

  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/u/${encodeURIComponent(post.author.username)}`}
          className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Avatar src={post.author.avatarUrl} alt={post.author.username} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{post.author.username}</p>
            <p className="text-xs text-muted">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        <Badge variant="tag">{POST_TYPE_LABELS[post.type]}</Badge>
      </div>

      <Link href={`/posts/${post.id}`} className="mt-3 block hover:underline">
        <h4 className="text-sm font-semibold text-foreground">{post.title}</h4>
      </Link>

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
        </div>
      )}

      {text && (
        <div className="mt-3">
          <p className={cn("whitespace-pre-line text-sm text-textSecondary", !expanded && "line-clamp-3")}>{text}</p>
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-medium text-accent hover:underline"
            >
              {expanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>
      )}

      {image && !imageBroken && (
        <div className="mt-3 overflow-hidden rounded-md border border-border">
          <img
            src={image}
            alt="Graphique joint à la publication"
            className="h-40 w-full object-cover"
            onError={() => setImageBroken(true)}
          />
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={onToggleLike}
          aria-pressed={post.isLikedByViewer}
          className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-loss"
        >
          <Heart className={cn("h-4 w-4", post.isLikedByViewer && "fill-loss text-loss")} />
          {post.likeCount}
        </button>
        <Link
          href={`/posts/${post.id}?comments=1`}
          className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
        >
          <MessageCircle className="h-4 w-4" />
          {post.commentCount}
        </Link>
        <Link
          href={`/posts/${post.id}`}
          className="ml-auto flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          Ouvrir
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}