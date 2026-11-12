"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { truncate } from "@/lib/notifications/helpers";
import { TRADING_STYLE_LABELS } from "@/types/profile";
import type { SuggestedProfile } from "@/types/notification";

interface SuggestionRowProps {
  profile: SuggestedProfile;
  followed: boolean;
  busy: boolean;
  onFollow: (username: string) => void;
}

export function SuggestionRow({ profile, followed, busy, onFollow }: SuggestionRowProps) {
  const followerCount = profile.followerCount ?? 0;

  // N'affiche que des informations publiques réellement renseignées.
  const headline = profile.tradingStyle
    ? TRADING_STYLE_LABELS[profile.tradingStyle]
    : profile.bio
    ? truncate(profile.bio, 70)
    : `${followerCount} abonné${followerCount > 1 ? "s" : ""}`;

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/u/${encodeURIComponent(profile.username)}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
      >
        <Avatar src={profile.avatarUrl} version={profile.avatarVersion} alt={profile.username} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{profile.username}</p>
          <p className="truncate text-xs text-muted">{headline}</p>
        </div>
      </Link>
      <Button
        size="sm"
        variant={followed ? "outline" : "subtle"}
        className="h-7 px-2.5 text-xs"
        disabled={busy || followed}
        onClick={() => onFollow(profile.username)}
      >
        {followed ? "Suivi" : "Suivre"}
      </Button>
    </div>
  );
}