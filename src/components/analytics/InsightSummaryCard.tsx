import { BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MIN_SAMPLE_SIZE } from "@/lib/analytics";
import type { InsightSummary } from "@/types/analytics";

const CATEGORY_LABELS: Record<InsightSummary["category"], string> = {
  setup: "Setup",
  instrument: "Instrument",
  session: "Session",
};

export function InsightSummaryCard({ summaries }: { summaries: InsightSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BarChart2 className="h-4 w-4 text-accent" />
          Constats statistiques
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2.5">
          {summaries.map((s) => (
            <p key={s.category} className="text-sm text-textSecondary">
              {s.insufficientData ? (
                <>
                  <span className="font-medium text-foreground">{CATEGORY_LABELS[s.category]} : </span>
                  Données insuffisantes pour tirer une conclusion fiable (moins de {MIN_SAMPLE_SIZE} trades).
                </>
              ) : (
                <>
                  Ton {CATEGORY_LABELS[s.category].toLowerCase()}{" "}
                  <span className="font-medium text-foreground">{s.label}</span> représente{" "}
                  <span className="font-medium text-foreground">{s.totalTrades} trades</span> et{" "}
                  <span className={s.totalR >= 0 ? "font-medium text-win" : "font-medium text-loss"}>
                    {s.totalR >= 0 ? "+" : ""}
                    {s.totalR}R
                  </span>{" "}
                  ({s.winRate}% WR).
                </>
              )}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}