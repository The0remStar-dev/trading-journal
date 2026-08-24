"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { TradeTable } from "@/components/trades/TradeTable";
import { TradeFormModal } from "@/components/trades/TradeFormModal";
import { TradeDetailModal } from "@/components/trades/TradeDetailModal";
import { ImportTradesModal } from "@/components/trades/ImportTradesModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTrades } from "@/lib/useTrades";
import type { Trade, TradeInput } from "@/types/trade";

export default function TradesPage() {
  const { trades, loading, error, createTrade, updateTrade, deleteTrade } = useTrades();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openNewTradeForm() {
    setEditingTrade(null);
    setFormOpen(true);
  }

  function openEditForm(trade: Trade) {
    setEditingTrade(trade);
    setFormOpen(true);
  }

  function openDetail(trade: Trade) {
    setDetailTrade(trade);
    setDetailOpen(true);
  }

  async function handleFormSubmit(input: TradeInput) {
    if (editingTrade) {
      await updateTrade(editingTrade.id, input);
    } else {
      await createTrade(input);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTrade(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Trade Log</h1>
            <p className="text-sm text-muted">Every trade, filterable and sortable.</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportTradesModal onSuccess={() => window.location.reload()} />
            <Button onClick={openNewTradeForm}>
              <Plus className="h-4 w-4" />
              Log Trade
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-96 animate-pulse rounded-lg border border-border bg-surface" />
        ) : (
          <TradeTable
            trades={trades}
            onView={openDetail}
            onEdit={openEditForm}
            onDelete={setDeleteTarget}
          />
        )}
      </main>

      <TradeFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        initialTrade={editingTrade}
        onSubmit={handleFormSubmit}
      />

      <TradeDetailModal trade={detailTrade} open={detailOpen} onOpenChange={setDetailOpen} />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Delete this trade?</DialogTitle>
            <DialogDescription>
              This permanently removes {deleteTarget?.symbol} ({deleteTarget && formatShortDate(deleteTarget.entryDate)}) from your journal. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Trade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}