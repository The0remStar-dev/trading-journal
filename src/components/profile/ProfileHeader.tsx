"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Lock, Settings, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/useToast";
import { EXPERIENCE_LEVEL_LABELS, TRADING_STYLE_LABELS } from "@/types/profile";
import type { PublicProfileIdentity } from "@/types/publicProfile";

interface ProfileHeaderProps {
  profile: PublicProfileIdentity;
  postCount: number | null;
  onFollowChanged: () => void;
}

export function ProfileHeader({ profile, postCount, onFollowChanged }: ProfileHeaderProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const avatarSrc = profile.avatarUrl ? `${profile.avatarUrl}?v=${profile.avatarVersion}` : null;
  const joined = new Date(profile.joinedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  async function toggleFollow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(profile.username)}/follow`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Action impossible.");
      onFollowChanged();
    } catch (err) {
      toast({ title: "Erreur", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
            {avatarSrc ? (
              <img src={avatarSrc} alt={profile.username} className="h-full w-full object-cover" />
            ) : (
              <User className="h-9 w-9 text-muted" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-foreground">{profile.fullName || profile.username}</h1>
                <p className="text-sm text-muted">@{profile.username}</p>
              </div>

              {profile.isOwnProfile ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings">
                    <Settings className="h-3.5 w-3.5" />
                    Modifier le profil
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={profile.isFollowing ? "outline" : "primary"}
                  onClick={toggleFollow}
                  disabled={busy}
                >
                  {profile.isFollowing ? "Suivi" : "Suivre"}
                </Button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile.tradingStyle && <Badge variant="neutral">{TRADING_STYLE_LABELS[profile.tradingStyle]}</Badge>}
              <Badge variant="tag">{EXPERIENCE_LEVEL_LABELS[profile.experienceLevel]}</Badge>
              {profile.isPrivate && (
                <Badge variant="default" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Profil privé
                </Badge>
              )}
            </div>

            {profile.bio && <p className="mt-3 whitespace-pre-line text-sm text-textSecondary">{profile.bio}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
              <span>
                <strong className="text-foreground">{profile.followerCount}</strong> abonné
                {profile.followerCount > 1 ? "s" : ""}
              </span>
              <span>
                <strong className="text-foreground">{profile.followingCount}</strong> abonnement
                {profile.followingCount > 1 ? "s" : ""}
              </span>
              {postCount !== null && (
                <span>
                  <strong className="text-foreground">{postCount}</strong> publication{postCount > 1 ? "s" : ""}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Membre depuis {joined}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}