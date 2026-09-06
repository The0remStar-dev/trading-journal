"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { PostFeed } from "@/components/posts/PostFeed";
import type { Post } from "@/types/post";

export default function FeedPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [justPublished, setJustPublished] = useState<Post | null>(null);

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Accueil</h1>
          <p className="text-sm text-muted">Partagez vos leçons avec la communauté TradeShare.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Créer un post
        </Button>
      </div>

      <PostFeed pendingNewPost={justPublished} />

      <CreatePostModal open={createOpen} onOpenChange={setCreateOpen} onSuccess={setJustPublished} />
    </AppShell>
  );
}