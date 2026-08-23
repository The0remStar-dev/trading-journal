import { Badge } from "@/components/ui/badge";
import type { TradeStatus } from "@/types/trade";

const STATUS_CONFIG: Record<TradeStatus, { label: string; variant: "win" | "loss" | "neutral" | "default" }> = {
  WIN: { label: "Win", variant: "win" },
  LOSS: { label: "Loss", variant: "loss" },
  BREAKEVEN: { label: "Breakeven", variant: "neutral" },
  OPEN: { label: "Open", variant: "default" },
};

export function StatusBadge({ status }: { status: TradeStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function DirectionBadge({ direction }: { direction: "LONG" | "SHORT" }) {
  return (
    <Badge variant={direction === "LONG" ? "win" : "loss"}>
      {direction === "LONG" ? "Long" : "Short"}
    </Badge>
  );
}
