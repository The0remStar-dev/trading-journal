import { AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { BehavioralPattern } from "@/types/analytics";

function pickTopPattern(patterns: BehavioralPattern[]): BehavioralPattern | null {
  const warning = patterns.find((p) => p.severity === "warning");
  if (warning) return warning;
  const positive = patterns.find((p) => p.severity === "positive");
  if (positive) return positive;
  const actionable = patterns.find((p) => p.id !== "insufficient-data" && p.id !== "no-clear-pattern");
  return actionable ?? null;
}

export function InsightCard({ patterns }: { patterns: BehavioralPattern[] }) {
  const top = pickTopPattern(patterns);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Point d'attention</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!top ? (
          <EmptyState
            icon={Sparkles}
            title="Pas encore assez de données"
            description="Continue à logger tes trades pour débloquer cette analyse."
          />
        ) : (
          <div className="flex gap-3">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                top.severity === "warning" && "bg-loss/10",
                top.severity === "positive" && "bg-win/10",
                top.severity === "info" && "bg-accent/10"
              )}
            >
              {top.severity === "positive" ? (
                <Sparkles className="h-4 w-4 text-win" />
              ) : (
                <AlertTriangle
                  className={cn("h-4 w-4", top.severity === "warning" ? "text-loss" : "text-accent")}
                />
              )}
            </div>
            <div>
              <p className="text-sm text-foreground">{top.description}</p>
              {top.occurrences !== undefined && (
                <p className="mt-1.5 text-xs font-medium text-muted">
                  {top.occurrences} situation{top.occurrences > 1 ? "s" : ""} observée{top.occurrences > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}