"use client";

import { Avatar } from "@/components/ui/avatar";
import { describeNotification, truncate } from "@/lib/notifications/helpers";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";

interface NotificationRowProps {
  notification: NotificationItem;
  onOpen: (notification: NotificationItem) => void;
}

export function NotificationRow({ notification, onOpen }: NotificationRowProps) {
  const { verb, subject } = describeNotification(notification);

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
        "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        !notification.isRead && "bg-accent/5"
      )}
    >
      <Avatar
        src={notification.actor.avatarUrl}
        version={notification.actor.avatarVersion}
        alt={notification.actor.username}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-textSecondary">
          <span className="font-medium text-foreground">{notification.actor.username}</span> {verb}
          {subject && <span className="text-foreground"> « {truncate(subject, 60)} »</span>}
        </p>
        <p className="mt-0.5 text-xs text-muted">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <>
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span className="sr-only">Non lue</span>
        </>
      )}
    </button>
  );
}