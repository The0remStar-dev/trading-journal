import { Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { BreakdownEntry } from "@/types/analytics";

const MIN_TRADES_FOR_EDGE = 3;

interface EdgeItem extends BreakdownEntry {
  category: string;
}

export function EdgeCard({
  byTag,
  byInstrument,
  bySession,
}: {
  byTag: BreakdownEntry[];
  byInstrument: BreakdownEntry[];
  bySession: BreakdownEntry[];
}) {
  const candidates: EdgeItem[] = [
    ...byTag.filter((e) => e.totalTrades >= MIN_TRADES_FOR_EDGE).map((e) => ({ ...e, category: "Setup" })),
    ...byInstrument.filter((e) => e.totalTrades >= MIN_TRADES_FOR_EDGE).map((e) => ({ ...e, category: "Instrument" })),
    ...bySession.filter((e) => e.totalTrades >= MIN_TRADES_FOR_EDGE).map((e) => ({ ...e, category: "Session" })),
  ]
    .filter((e) => e.totalR > 0)
    .sort((a, b) => b.totalR - a.totalR)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Ce qui fonctionne pour toi</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {candidates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Pas encore d'edge identifié"
            description="Ajoute des tags et logge plus de trades pour faire ressortir tes points forts."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {candidates.map((item) => (
              <div key={`${item.category}-${item.key}`} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.key}</p>
                  <p className="text-xs text-muted">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-win">+{item.totalR}R</p>
                  <p className="text-xs text-muted">{item.winRate}% WR</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}