import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ElementType;
  tone?: "win" | "loss" | "neutral";
}

export function StatCard({ label, value, sub, icon: Icon, tone = "neutral" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
          {Icon && (
            <Icon
              className={cn(
                "h-4 w-4",
                tone === "win" && "text-win",
                tone === "loss" && "text-loss",
                tone === "neutral" && "text-accent"
              )}
            />
          )}
        </div>
        <p
          className={cn(
            "text-mono-num text-xl font-semibold",
            tone === "win" && "text-win",
            tone === "loss" && "text-loss",
            tone === "neutral" && "text-foreground"
          )}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </CardContent>
    </Card>
  );
}