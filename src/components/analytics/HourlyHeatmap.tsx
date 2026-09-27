import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HeatmapCell } from "@/types/analytics";

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function HourlyHeatmap({ data }: { data: HeatmapCell[] }) {
  const map = new Map<string, HeatmapCell>();
  for (const cell of data) map.set(`${cell.dayOfWeek}-${cell.hour}`, cell);

  const maxAbs = Math.max(0.1, ...data.map((c) => Math.abs(c.avgR)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          Performance par heure (UTC) et jour de semaine
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-0">
        {data.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted">
            Pas assez de trades clôturés pour une heatmap.
          </div>
        ) : (
          <div className="inline-flex flex-col gap-1">
            <div className="flex gap-1 pl-8">
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="w-5 shrink-0 text-center text-[9px] text-muted">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <div key={day} className="flex items-center gap-1">
                <span className="w-7 shrink-0 text-[10px] text-muted">{DAY_LABELS[day]}</span>
                {Array.from({ length: 24 }).map((_, hour) => {
                  const cell = map.get(`${day}-${hour}`);
                  const intensity = cell ? Math.min(1, Math.abs(cell.avgR) / maxAbs) : 0;
                  const isWin = cell ? cell.avgR >= 0 : true;
                  return (
                    <div
                      key={hour}
                      title={cell ? `${DAY_LABELS[day]} ${hour}h — ${cell.avgR >= 0 ? "+" : ""}${cell.avgR}R · ${cell.winRate}% WR (${cell.totalTrades} trades)` : "Aucune donnée"}
                      className={cn(
                        "h-5 w-5 shrink-0 rounded-sm",
                        !cell && "bg-background",
                        cell && isWin && "bg-win",
                        cell && !isWin && "bg-loss"
                      )}
                      style={cell ? { opacity: 0.2 + intensity * 0.8 } : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}