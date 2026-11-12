"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { FeedTabs } from "@/components/community/FeedTabs";
import { NotificationsPanel } from "@/components/community/NotificationsPanel";
import { SuggestionsPanel } from "@/components/community/SuggestionsPanel";
import { useNotifications } from "@/lib/useNotifications";
import { useSuggestions } from "@/lib/useSuggestions";
import { formatBadgeCount, getNotificationHref } from "@/lib/notifications/helpers";
import { cn } from "@/lib/utils";
import type { FeedType, Post } from "@/types/post";
import type { NotificationFilter, NotificationItem } from "@/types/notification";

type MobilePanel = "posts" | "notifications" | "discover";

const MOBILE_TABS: { value: MobilePanel; label: string }[] = [
  { value: "posts", label: "Publications" },
  { value: "notifications", label: "Notifications" },
  { value: "discover", label: "À découvrir" },
];

function FeedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [createOpen, setCreateOpen] = useState(false);
  const [justPublished, setJustPublished] = useState<Post | null>(null);
  const [feedType, setFeedType] = useState<FeedType>("foryou");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("posts");
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const notifications = useNotifications({ filter, limit: 15 });
  const suggestions = useSuggestions(5);

  // /feed?panel=notifications : ouvre l'onglet mobile et fait défiler jusqu'au panneau.
  useEffect(() => {
    if (searchParams.get("panel") === "notifications") {
      setMobilePanel("notifications");
      requestAnimationFrame(() =>
        document.getElementById("notifications-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }, [searchParams]);

  async function openNotification(n: NotificationItem) {
    await notifications.markRead(n.id);
    router.push(getNotificationHref(n));
  }

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

      {/* Mobile / tablette : zones empilées en onglets. */}
      <div className="mb-4 flex gap-1 rounded-md border border-border bg-surface p-1 lg:hidden">
        {MOBILE_TABS.map((tab) => {
          const badge = tab.value === "notifications" ? formatBadgeCount(notifications.unreadCount) : null;
          return (
            <Button
              key={tab.value}
              size="sm"
              variant={mobilePanel === tab.value ? "primary" : "ghost"}
              className={cn("h-8 flex-1 gap-1.5 text-xs", mobilePanel !== tab.value && "text-textSecondary")}
              onClick={() => setMobilePanel(tab.value)}
            >
              {tab.label}
              {badge && (
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className={cn(mobilePanel !== "posts" && "hidden lg:block")}>
          <div className="mb-5">
            <FeedTabs value={feedType} onChange={setFeedType} />
          </div>
          <CommunityFeed feedType={feedType} pendingNewPost={justPublished} />
        </section>

        <aside className="flex flex-col gap-5">
          <div className={cn(mobilePanel !== "notifications" && "hidden lg:block")}>
            <NotificationsPanel
              items={notifications.items}
              unreadCount={notifications.unreadCount}
              loading={notifications.loading}
              loadingMore={notifications.loadingMore}
              error={notifications.error}
              actionError={notifications.actionError}
              hasMore={notifications.hasMore}
              filter={filter}
              onFilterChange={setFilter}
              onLoadMore={notifications.loadMore}
              onOpen={openNotification}
              onMarkAllRead={notifications.markAllRead}
              onRetry={notifications.reload}
              onBrowseFeed={() => setMobilePanel("posts")}
            />
          </div>

          <div className={cn(mobilePanel !== "discover" && "hidden lg:block")}>
            <SuggestionsPanel
              suggestions={suggestions.suggestions}
              followed={suggestions.followed}
              busy={suggestions.busy}
              loading={suggestions.loading}
              error={suggestions.error}
              actionError={suggestions.actionError}
              onFollow={suggestions.follow}
              onRetry={() => suggestions.reload()}
            />
          </div>
        </aside>
      </div>

      <CreatePostModal open={createOpen} onOpenChange={setCreateOpen} onSuccess={setJustPublished} />
    </AppShell>
  );
}

// useSearchParams exige une frontière Suspense pour que le build Next.js passe.
export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <Skeleton className="h-96" />
        </AppShell>
      }
    >
      <FeedPageContent />
    </Suspense>
  );
}