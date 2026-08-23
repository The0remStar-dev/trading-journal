"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, DirectionBadge } from "@/components/trades/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, formatDateTime, cn } from "@/lib/utils";
import type { Trade } from "@/types/trade";

export function TradeDetailModal({
  trade,
  open,
  onOpenChange,
}: {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!trade) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{trade.symbol}</DialogTitle>
              <DirectionBadge direction={trade.direction} />
              <StatusBadge status={trade.status} />
            </div>
            <p className="text-xs text-muted">
              {formatDateTime(trade.entryDate)}
              {trade.exitDate ? ` → ${formatDateTime(trade.exitDate)}` : " (still open)"}
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-background p-4 sm:grid-cols-4">
            <Metric label="Net PnL" value={formatCurrency(trade.pnl)} tone={trade.pnl >= 0 ? "win" : "loss"} />
            <Metric label="PnL %" value={formatPercent(trade.pnlPercentage)} tone={trade.pnlPercentage >= 0 ? "win" : "loss"} />
            <Metric label="Entry / Exit" value={`${trade.entryPrice} / ${trade.exitPrice ?? "—"}`} />
            <Metric label="Size" value={String(trade.positionSize)} />
            <Metric label="Fees" value={formatCurrency(trade.fees)} />
            <Metric label="Risk:Reward" value={trade.riskRewardRatio ? `${trade.riskRewardRatio}R` : "—"} />
            <Metric label="Account" value={trade.accountType} />
            <Metric label="Status" value={trade.status} />
          </div>

          {trade.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {trade.tags.map((tag) => (
                <Badge key={tag} variant="tag">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {trade.notes && (
            <div className="prose prose-invert prose-sm mt-4 max-w-none rounded-md border border-border bg-background p-4 text-foreground">
              <ReactMarkdown>{trade.notes}</ReactMarkdown>
            </div>
          )}

          {(trade.beforeImageUrl || trade.afterImageUrl) && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {trade.beforeImageUrl && (
                <ScreenshotThumb
                  label="Pre-Trade Setup"
                  src={trade.beforeImageUrl}
                  onZoom={() => setZoomedImage(trade.beforeImageUrl)}
                />
              )}
              {trade.afterImageUrl && (
                <ScreenshotThumb
                  label="Post-Trade Result"
                  src={trade.afterImageUrl}
                  onZoom={() => setZoomedImage(trade.afterImageUrl)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen zoom overlay for screenshots */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-black/90 p-6"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Trade screenshot" className="max-h-full max-w-full rounded-md object-contain" />
        </div>
      )}
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "win" | "loss" }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "text-mono-num text-sm font-semibold text-foreground",
          tone === "win" && "text-win",
          tone === "loss" && "text-loss"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ScreenshotThumb({ label, src, onZoom }: { label: string; src: string; onZoom: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <button
        onClick={onZoom}
        className="cursor-zoom-in overflow-hidden rounded-md border border-border transition-opacity hover:opacity-90"
      >
        <img src={src} alt={label} className="h-40 w-full object-cover" />
      </button>
    </div>
  );
}
