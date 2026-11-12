"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, FileX } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/community/PostCard";
import { ApiError, fetchJson } from "@/lib/fetchJson";
import type { Post } from "@/types/post";

type ViewState = "loading" | "ready" | "notfound" | "error";

function PostDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<ViewState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const commentId = searchParams.get("comment");
  const openComments = !!commentId || searchParams.get("comments") === "1";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const data = await fetchJson<{ post: Post }>(`/api/posts/${encodeURIComponent(params.id)}`);
        if (cancelled) return;
        setPost(data.post);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setState("notfound");
        } else {
          setErrorMessage(err instanceof Error ? err.message : "Impossible de charger la publication.");
          setState("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <AppShell>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-textSecondary">
        <Link href="/feed">
          <ArrowLeft className="h-4 w-4" />
          Communauté
        </Link>
      </Button>

      {state === "loading" && <Skeleton className="h-72" />}

      {state === "notfound" && (
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState
            icon={FileX}
            title="Publication introuvable"
            description="Elle a peut-être été supprimée ou n'est plus accessible."
            className="py-16"
          />
        </div>
      )}

      {state === "error" && (
        <div className="flex items-center gap-2 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {state === "ready" && post && (
        <div className="mx-auto max-w-2xl">
          <PostCard
            post={post}
            onDelete={() => router.push("/feed")}
            onPatch={(_id, patch) => setPost((p) => (p ? { ...p, ...patch } : p))}
            defaultCommentsOpen={openComments}
            highlightCommentId={commentId}
          />
        </div>
      )}
    </AppShell>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <Skeleton className="h-72" />
        </AppShell>
      }
    >
      <PostDetailContent />
    </Suspense>
  );
}