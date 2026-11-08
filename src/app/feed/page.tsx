"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { FeedTabs } from "@/components/community/FeedTabs";
import { NotificationsPanel } from "@/components/community/NotificationsPanel";
import { ProfileSuggestions } from "@/components/community/ProfileSuggestions";
import type { FeedType, Post } from "@/types/post";

export default function FeedPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [justPublished, setJustPublished] = useState<Post | null>(null);
  const [feedType, setFeedType] = useState<FeedType>("foryou");

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Communauté</h1>
          <p className="mt-1 text-sm text-muted">Partagez vos leçons, découvrez celles des autres.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Créer un post
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <div className="mb-5">
            <FeedTabs value={feedType} onChange={setFeedType} />
          </div>
          <CommunityFeed feedType={feedType} pendingNewPost={justPublished} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <NotificationsPanel />
          <ProfileSuggestions />
        </aside>
      </div>

      <CreatePostModal open={createOpen} onOpenChange={setCreateOpen} onSuccess={setJustPublished} />
    </AppShell>
  );
}