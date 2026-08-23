import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import type { TagPerformance as TagPerformanceType } from "@/lib/calculations";

export function TagPerformance({ data }: { data: TagPerformanceType[] }) {
  const maxAbsPnl = Math.max(1, ...data.map((d) => Math.abs(d.totalPnl)));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm text-foreground">Tag Performance</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted">
            Tag your trades (e.g. FVG, BOS) to see strategy breakdowns here.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((tag) => {
              const isWin = tag.totalPnl >= 0;
              const widthPct = Math.max(4, (Math.abs(tag.totalPnl) / maxAbsPnl) * 100);
              return (
                <div key={tag.tag} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 truncate text-sm text-foreground">{tag.tag}</div>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-background">
                    <div
                      className={cn(
                        "h-full rounded-md transition-all",
                        isWin ? "bg-win/70" : "bg-loss/70"
                      )}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <div className="w-20 shrink-0 text-right text-mono-num text-sm font-medium">
                    <span className={isWin ? "text-win" : "text-loss"}>
                      {formatCurrency(tag.totalPnl)}
                    </span>
                  </div>
                  <div className="w-16 shrink-0 text-right text-xs text-muted">
                    {tag.winRate}% WR
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
