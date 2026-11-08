"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Loader2, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPERIENCE_LEVEL_LABELS, TRADING_STYLE_LABELS } from "@/types/profile";
import type { ProfileSuggestion } from "@/types/notification";

export function ProfileSuggestions({ compact = false, limit = 5 }: { compact?: boolean; limit?: number }) {
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUsername, setBusyUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/users/suggestions", { cache: "no-store" });
      const data: { suggestions: ProfileSuggestion[]; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de charger les suggestions.");
      setSuggestions(data.suggestions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger les suggestions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  async function follow(username: string) {
    if (busyUsername) return;
    setBusyUsername(username);
    setError(null);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFollowing: true }),
      });
      const data: { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de suivre ce profil.");
      setSuggestions((current) => current.filter((item) => item.username !== username));
      window.dispatchEvent(new Event("notifications:updated"));
      void loadSuggestions();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de suivre ce profil.");
    } finally {
      setBusyUsername(null);
    }
  }

  const content = (
    <>
      {error && <p role="alert" className="mb-2 rounded-md bg-loss-dim px-2.5 py-2 text-xs text-loss">{error}</p>}
      {loading ? (
        <div className="flex items-center justify-center py-5 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="sr-only">Chargement des profils suggérés</span>
        </div>
      ) : suggestions.length === 0 ? (
        <p className="rounded-md border border-border bg-background px-3 py-4 text-center text-xs text-muted">
          Aucun profil public à découvrir pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {suggestions.slice(0, limit).map((profile) => (
            <div key={profile.username} className="flex items-center gap-2.5">
              <Link href={`/u/${encodeURIComponent(profile.username)}`} aria-label={`Voir le profil de ${profile.username}`}>
                <Avatar src={profile.avatarUrl} alt={profile.username} size="sm" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/u/${encodeURIComponent(profile.username)}`}
                  className="block truncate text-xs font-medium text-foreground hover:text-accent"
                >
                  {profile.username}
                </Link>
                <p className="truncate text-[10px] text-muted">
                  {profile.tradingStyle ? TRADING_STYLE_LABELS[profile.tradingStyle] : profile.bio || EXPERIENCE_LEVEL_LABELS[profile.experienceLevel]}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px]"
                disabled={busyUsername !== null}
                onClick={() => void follow(profile.username)}
              >
                {busyUsername === profile.username ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                <span>Suivre</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <section aria-label="Suggestions de profils">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Compass className="h-3.5 w-3.5 text-muted" />
          À découvrir
        </h4>
        {content}
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Compass className="h-4 w-4 text-muted" /> À découvrir
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
