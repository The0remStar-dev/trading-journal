"use client";

import { useNotificationCount } from "@/lib/useNotificationCount";

export function NotificationBadge({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const unreadCount = useNotificationCount();
  if (unreadCount === 0) return null;

  return (
    <span
      aria-label={`${unreadCount} notification${unreadCount === 1 ? "" : "s"} non lue${unreadCount === 1 ? "" : "s"}`}
      className={`${className} ${
        compact
          ? "absolute right-2 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface lg:right-2 lg:top-2"
          : "rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
      }`}
    >
      {!compact && (unreadCount > 99 ? "99+" : unreadCount)}
    </span>
  );
}
