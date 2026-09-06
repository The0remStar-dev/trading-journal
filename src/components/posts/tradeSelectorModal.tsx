"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DirectionBadge } from "@/components/trades/StatusBadge";
import { formatDate, cn } from "@/lib/utils";
import type { SelectableTrade } from "@/types/post";

interface TradeSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (trade: SelectableTrade) => void;
}

export function TradeSelectorModal({ open, onOpenChange, onSelect }: TradeSelectorModalProps) {
  const [trades, setTrades] = useState<SelectableTrade[]>([]);
  const [riskConfigured, setRiskConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/trades/selectable")
      .then((res) => res.json())
      .then((data) => {
        setTrades(data.trades ?? []);
        setRiskConfigured(data.riskConfigured ?? false);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return trades;
    const q = search.trim().toUpperCase();
    return trades.filter((t) => t.symbol.includes(q));
  }, [trades, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Importer depuis mon journal</DialogTitle>
          <DialogDescription>
            Sélectionnez un trade clôturé — son résultat sera automatiquement converti en R-multiple.
          </DialogDescription>
        </DialogHeader>

        {!riskConfigured && (
          <div className="mb-3 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
            Configurez votre capital initial et votre risque par trade dans Paramètres avant de
            pouvoir importer un trade dans une publication.
          </div>
        )}

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Rechercher un symbole..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-96 overflow-y-auto rounded-md border border-border">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">
              Aucun trade clôturé ne correspond à votre recherche.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((trade) => (
                <li key={trade.id}>
                  <button
                    type="button"
                    disabled={!riskConfigured}
                    onClick={() => {
                      onSelect(trade);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-background",
                      !riskConfigured && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{trade.symbol}</span>
                      <DirectionBadge direction={trade.direction} />
                      <span className="text-xs text-muted">{formatDate(trade.entryDate)}</span>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        trade.rMultiple === null
                          ? "text-muted"
                          : trade.rMultiple >= 0
                          ? "text-win"
                          : "text-loss"
                      )}
                    >
                      {trade.rMultiple !== null
                        ? `${trade.rMultiple >= 0 ? "+" : ""}${trade.rMultiple.toFixed(2)}R`
                        : "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}