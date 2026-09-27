"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BehavioralPattern } from "@/types/analytics";

export function BehavioralInsights({ patterns }: { patterns: BehavioralPattern[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Insights comportementaux</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {patterns.length === 0 ? (
          <p className="text-sm text-muted">Aucun signal comportemental détecté pour cette période.</p>
        ) : (
          <div className="space-y-3">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="flex gap-3 rounded-md border border-border bg-secondary/20 p-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    pattern.severity === "warning" && "bg-loss/10",
                    pattern.severity === "positive" && "bg-win/10",
                    pattern.severity === "info" && "bg-accent/10"
                  )}
                >
                  {pattern.severity === "positive" ? (
                    <Sparkles className="h-4 w-4 text-win" />
                  ) : (
                    <AlertTriangle className={cn("h-4 w-4", pattern.severity === "warning" ? "text-loss" : "text-accent")} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{pattern.title}</p>
                  <p className="mt-1 text-sm text-textSecondary">{pattern.description}</p>
                  {pattern.occurrences !== undefined && (
                    <p className="mt-2 text-xs font-medium text-muted">
                      {pattern.occurrences} occurrence{pattern.occurrences > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
