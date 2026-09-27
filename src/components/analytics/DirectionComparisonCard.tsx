import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { BreakdownEntry } from "@/types/analytics";

export function DirectionComparisonCard({ data }: { data: BreakdownEntry[] }) {
  const long = data.find((d) => d.key === "LONG");
  const short = data.find((d) => d.key === "SHORT");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Long vs Short</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!long && !short ? (
          <EmptyState title="Aucune donnée directionnelle" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <DirectionBlock icon={ArrowUp} label="Long" entry={long} />
            <DirectionBlock icon={ArrowDown} label="Short" entry={short} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DirectionBlock({ icon: Icon, label, entry }: { icon: React.ElementType; label: string; entry?: BreakdownEntry }) {
  const totalR = entry?.totalR ?? 0;
  const positive = totalR >= 0;

  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={cn("text-lg font-semibold", positive ? "text-win" : "text-loss")}>
        {entry ? `${totalR >= 0 ? "+" : ""}${totalR}R` : "—"}
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {entry ? `${entry.winRate}% WR · ${entry.totalTrades} trades` : "Aucune donnée"}
      </p>
    </div>
  );
}