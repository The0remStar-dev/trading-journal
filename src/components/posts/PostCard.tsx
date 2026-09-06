import { Camera, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DirectionBadge } from "@/components/trades/StatusBadge";
import { EMOTION_LABELS } from "@/types/trade";
import { EXPERIENCE_LEVEL_LABELS as PROFILE_EXPERIENCE_LABELS } from "@/types/profile";
import { cn } from "@/lib/utils";
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

export function PostCard({ post }: { post: Post }) {
  return (
    <Card>
      <CardContent className="p-5">
        {/* En-tête : auteur */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt={post.author.username} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-muted" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{post.author.username}</span>
            <span className="text-xs text-muted">
              {PROFILE_EXPERIENCE_LABELS[post.author.experienceLevel]} · {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        <h3 className="text-base font-semibold text-foreground">{post.title}</h3>

        {/* Contexte de marché, si un trade est lié — JAMAIS de montant brut ici */}
        {post.symbol && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="tag">{post.symbol}</Badge>
            {post.direction && <DirectionBadge direction={post.direction} />}
            {post.rMultiple !== null && (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-semibold",
                  post.rMultiple >= 0
                    ? "border-win/30 bg-win-dim text-win"
                    : "border-loss/30 bg-loss-dim text-loss"
                )}
              >
                {post.rMultiple >= 0 ? "+" : ""}
                {post.rMultiple.toFixed(2)}R
              </span>
            )}
            <Badge variant="neutral">{EMOTION_LABELS[post.emotion]}</Badge>
          </div>
        )}
        {!post.symbol && (
          <div className="mt-2">
            <Badge variant="neutral">{EMOTION_LABELS[post.emotion]}</Badge>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Résumé de l'erreur</p>
            <p className="mt-1 text-foreground">{post.mistakeSummary}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Leçon apprise</p>
            <p className="mt-1 text-foreground">{post.lessonLearned}</p>
          </div>
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
        {!post.beforeImageUrl && !post.afterImageUrl && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
            <Camera className="h-3.5 w-3.5" />
            Aucun graphique joint
          </div>
        )}
      </CardContent>
    </Card>
  );
}