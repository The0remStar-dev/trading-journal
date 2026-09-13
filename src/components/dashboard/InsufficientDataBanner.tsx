import { Info } from "lucide-react";

export function InsufficientDataBanner({ closedTrades, minimum = 5 }: { closedTrades: number; minimum?: number }) {
  if (closedTrades === 0 || closedTrades >= minimum) return null;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-textSecondary">
      <Info className="h-4 w-4 shrink-0 text-accent" />
      <span>
        {closedTrades} trade{closedTrades > 1 ? "s" : ""} clôturé{closedTrades > 1 ? "s" : ""} seulement — les
        statistiques ci-dessous se fiabiliseront à partir de {minimum} trades.
      </span>
    </div>
  );
}