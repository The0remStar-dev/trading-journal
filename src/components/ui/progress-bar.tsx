import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percent: number; // 0-100
  className?: string;
  tone?: "accent" | "win";
}

export function ProgressBar({ percent, className, tone = "accent" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn("h-full rounded-full transition-all", tone === "win" ? "bg-win" : "bg-accent")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}