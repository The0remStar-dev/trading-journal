"use client";

import { useEffect, useState } from "react";
import { Send, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/useToast";
import type { Comment } from "@/types/community";

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} j`;
}

export function CommentSection({ postId, onCountChange }: { postId: string; onCountChange: (count: number) => void }) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments((prev) => {
        const next = [...prev, data.comment];
        onCountChange(next.length);
        return next;
      });
      setInput("");
    } catch (error) {
      toast({
        title: "Envoi impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => {
        const next = prev.filter((c) => c.id !== commentId);
        onCountChange(next.length);
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : (
        <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                {c.author.avatarUrl ? (
                  <img src={c.author.avatarUrl} alt={c.author.username} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-3.5 w-3.5 text-muted" />
                )}
              </div>
              <div className="flex-1 rounded-md bg-secondary px-3 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{c.author.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted">{timeAgo(c.createdAt)}</span>
                    {c.canDelete && (
                      <button onClick={() => handleDelete(c.id)} className="text-muted hover:text-loss">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-sm text-textSecondary">{c.body}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-xs text-muted">Aucun commentaire pour l'instant.</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent"
        />
        <Button type="submit" size="icon" variant="ghost" disabled={!input.trim() || submitting}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}