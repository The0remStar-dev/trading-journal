"use client";

import { Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestionRow } from "@/components/community/SuggestionRow";
import type { SuggestedProfile } from "@/types/notification";

interface SuggestionsPanelProps {
  suggestions: SuggestedProfile[];
  followed: string[];
  busy: string[];
  loading: boolean;
  error: string | null;
  actionError: string | null;
  onFollow: (username: string) => void;
  onRetry: () => void;
}

export function SuggestionsPanel({
  suggestions,
  followed,
  busy,
  loading,
  error,
  actionError,
  onFollow,
  onRetry,
}: SuggestionsPanelProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Compass className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-medium text-foreground">À découvrir</h2>
        </div>

        {actionError && (
          <p className="mb-2 rounded-md border border-loss/30 bg-loss-dim px-3 py-2 text-xs text-loss">{actionError}</p>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-start gap-2 text-sm text-loss">
            {error}
            <Button size="sm" variant="outline" onClick={onRetry}>
              Réessayer
            </Button>
          </div>
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="Aucune suggestion pour le moment"
            description="Reviens plus tard : de nouveaux traders actifs apparaîtront ici."
            className="py-6"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {suggestions.map((profile) => (
              <SuggestionRow
                key={profile.username}
                profile={profile}
                followed={followed.includes(profile.username)}
                busy={busy.includes(profile.username)}
                onFollow={onFollow}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}