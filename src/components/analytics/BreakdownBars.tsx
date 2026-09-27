"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { BreakdownEntry } from "@/types/analytics";

export function BreakdownBars({
  title,
  data,
  emptyMessage,
}: {
  title: string;
  data: BreakdownEntry[];
  emptyMessage: string;
}) {
  const maxTotalR = data.reduce((max, item) => Math.max(max, Math.abs(item.totalR) || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <EmptyState title={emptyMessage} />
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((item) => {
              const width = maxTotalR > 0 ? Math.max(8, (Math.abs(item.totalR) / maxTotalR) * 100) : 0;
              const positive = item.totalR >= 0;

              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-textSecondary">{item.key}</span>
                    <span className={cn("font-medium", positive ? "text-win" : "text-loss")}>
                      {item.totalR >= 0 ? "+" : ""}
                      {item.totalR}R
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full", positive ? "bg-win" : "bg-loss")}
                      style={{ width: `${width}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>{item.totalTrades} trades</span>
                    <span>{item.winRate}% WR</span>
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
