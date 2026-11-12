"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { Sidebar, useSidebarCollapse } from "@/components/layout/Sidebar";
import { useUnreadCount } from "@/lib/useUnreadCount";
import { formatBadgeCount } from "@/lib/notifications/helpers";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapse();

  // Un seul poller par page, partagé entre la sidebar et la barre mobile.
  const { count: unreadCount } = useUnreadCount();
  const badgeLabel = formatBadgeCount(unreadCount);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggle}
        unreadCount={unreadCount}
      />

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-foreground" aria-label="Ouvrir le menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold tracking-wide text-foreground">
            TRADE<span className="text-win">SHARE</span>
          </span>
        </div>

        <Link
          href="/feed?panel=notifications"
          className="relative text-foreground"
          aria-label={
            unreadCount > 0
              ? `Notifications : ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {badgeLabel && (
            <span className="absolute -right-2 -top-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              {badgeLabel}
            </span>
          )}
        </Link>
      </div>

      <main className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}