import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/trade";

export function DailyChecklist({ trades }: { trades: Trade[] }) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTrades = trades.filter((t) => t.entryDate.slice(0, 10) === todayKey);

  const loggedToday = todayTrades.length > 0;
  const riskRespectedToday =
    todayTrades.length > 0 && todayTrades.every((t) => t.planRespected !== false);

  const items = [
    { label: "Journaliser tes trades", done: loggedToday },
    { label: "Respecter ton risque", done: loggedToday && riskRespectedToday },
    { label: "Faire ta review", done: false },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Objectif du jour</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-win" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted" />
              )}
              <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted")}>{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
