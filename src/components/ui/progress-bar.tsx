import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  tone?: "accent" | "win" | "loss";
  className?: string;
}

export function ProgressBar({ value, tone = "accent", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "accent" && "bg-accent",
          tone === "win" && "bg-win",
          tone === "loss" && "bg-loss"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}