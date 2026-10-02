import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeedType } from "@/types/post";

const TABS: { value: FeedType; label: string }[] = [
  { value: "foryou", label: "Pour toi" },
  { value: "following", label: "Following" },
  { value: "popular", label: "Popular" },
  { value: "trades", label: "Trades" },
  { value: "mistakes", label: "Erreurs" },
  { value: "lessons", label: "Leçons" },
  { value: "setups", label: "Setups" },
];

export function FeedTabs({ value, onChange }: { value: FeedType; onChange: (v: FeedType) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-border bg-surface p-1">
      {TABS.map((tab) => (
        <Button
          key={tab.value}
          size="sm"
          variant={value === tab.value ? "primary" : "ghost"}
          className={cn("h-8 text-xs", value !== tab.value && "text-textSecondary")}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}