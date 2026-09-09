"use client";

import { Search, Bell, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface HeaderProps {
  username?: string;
  avatarUrl?: string | null;
}

export function Header({ username, avatarUrl }: HeaderProps) {
  return (
    <div className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-surface px-6 lg:flex">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <input
          placeholder="Rechercher..."
          className="h-9 w-full rounded-md border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-secondary hover:text-foreground">
          <MessageSquare className="h-4 w-4" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-secondary hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <Avatar src={avatarUrl} alt={username} size="sm" />
      </div>
    </div>
  );
}