import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "win" | "loss" | "neutral" | "accent";
}

export function StatCard({ title, value, sub, icon: Icon, tone = "neutral" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="text-[11px] uppercase tracking-wide">{title}</CardTitle>
          {Icon && (
            <Icon
              className={cn(
                "h-4 w-4",
                tone === "win" && "text-success",
                tone === "loss" && "text-danger",
                tone === "accent" && "text-accent",
                tone === "neutral" && "text-subtle"
              )}
            />
          )}
        </div>
        <p
          className={cn(
            "text-mono-num text-xl font-semibold",
            tone === "win" && "text-success",
            tone === "loss" && "text-danger",
            tone === "accent" && "text-accent",
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