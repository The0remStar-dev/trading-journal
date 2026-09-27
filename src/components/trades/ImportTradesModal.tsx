"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

interface ImportTradesModalProps {
  onSuccess?: () => void;
}

interface PreviewRow {
  rowNumber: number;
  status: "valid" | "duplicate" | "error";
  reason?: string;
  trade?: {
    symbol: string;
    direction: "LONG" | "SHORT";
    entryDate: string;
    entryPrice: number;
    exitPrice: number | null;
    positionSize: number;
  };
}

type Step = "upload" | "preview" | "done";

export function ImportTradesModal({ onSuccess }: ImportTradesModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmResult, setConfirmResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setStep("upload");
    setLoading(false);
    setError(null);
    setRows([]);
    setSelected(new Set());
    setConfirmResult(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetState();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/trades/import/preview", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l'analyse du fichier.");
        setLoading(false);
        return;
      }

      setRows(data.rows);
      setSelected(new Set(data.rows.filter((r: PreviewRow) => r.status === "valid").map((r: PreviewRow) => r.rowNumber)));
      setStep("preview");
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function toggleRow(rowNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const tradesToImport = rows
      .filter((r) => r.status === "valid" && selected.has(r.rowNumber) && r.trade)
      .map((r) => r.trade);

    if (tradesToImport.length === 0) {
      setError("Sélectionnez au moins un trade à importer.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/trades/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: tradesToImport }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l'importation.");
        setLoading(false);
        return;
      }

      setConfirmResult({ imported: data.imported, skipped: data.skipped, errors: data.errors.length });
      setStep("done");
      onSuccess?.();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  const validCount = rows.filter((r) => r.status === "valid").length;
  const duplicateCount = rows.filter((r) => r.status === "duplicate").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="subtle" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Importer Fichier
      </Button>

      <DialogContent size={step === "preview" ? "xl" : "md"}>
        <DialogHeader>
          <DialogTitle>Importer des trades</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Formats acceptés : .csv, .xlsx, .xls ou .zip (export de courtier)."}
            {step === "preview" && "Vérifiez les lignes détectées avant de confirmer l'import."}
            {step === "done" && "Import terminé."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.zip" onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-secondary py-10 text-center transition-colors",
                !loading && "cursor-pointer hover:border-accent/50",
                loading && "cursor-not-allowed opacity-70"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <span className="text-sm text-muted">Analyse du fichier...</span>
                </>
              ) : (
                <>
                  <FileUp className="h-6 w-6 text-muted" />
                  <span className="text-sm text-foreground">Cliquez pour sélectionner un fichier</span>
                  <span className="text-xs text-muted">.csv, .xlsx, .xls, .zip</span>
                </>
              )}
            </button>
          </>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="win">{validCount} valides</Badge>
              {duplicateCount > 0 && <Badge variant="default">{duplicateCount} doublons</Badge>}
              {errorCount > 0 && <Badge variant="loss">{errorCount} erreurs</Badge>}
            </div>

            <div className="max-h-96 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-secondary">
                  <tr className="text-left text-muted">
                    <th className="p-2"></th>
                    <th className="p-2">Ligne</th>
                    <th className="p-2">Symbole</th>
                    <th className="p-2">Direction</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Statut / raison</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rowNumber} className="border-t border-border">
                      <td className="p-2">
                        {row.status === "valid" && (
                          <input
                            type="checkbox"
                            checked={selected.has(row.rowNumber)}
                            onChange={() => toggleRow(row.rowNumber)}
                            className="h-3.5 w-3.5 accent-accent"
                          />
                        )}
                      </td>
                      <td className="p-2 text-muted">{row.rowNumber}</td>
                      <td className="p-2 font-medium text-foreground">{row.trade?.symbol ?? "—"}</td>
                      <td className="p-2 text-muted">{row.trade?.direction ?? "—"}</td>
                      <td className="p-2 text-muted">{row.trade ? formatDate(row.trade.entryDate) : "—"}</td>
                      <td className="p-2">
                        {row.status === "valid" && <span className="text-win">Prêt à importer</span>}
                        {row.status === "duplicate" && <span className="text-muted">{row.reason}</span>}
                        {row.status === "error" && <span className="text-loss">{row.reason}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-loss/30 bg-loss-dim px-4 py-2.5 text-sm text-loss">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" onClick={() => setStep("upload")}>Retour</Button>
              <Button onClick={handleConfirm} disabled={loading || selected.size === 0}>
                {loading ? "Import en cours..." : `Importer ${selected.size} trade(s)`}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && confirmResult && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-md border border-win/30 bg-win-dim px-4 py-3 text-sm text-win">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {confirmResult.imported} trade{confirmResult.imported > 1 ? "s" : ""} importé{confirmResult.imported > 1 ? "s" : ""}
                {confirmResult.skipped > 0 && ` (${confirmResult.skipped} doublon(s) ignoré(s))`}
                {confirmResult.errors > 0 && ` — ${confirmResult.errors} ligne(s) rejetée(s)`}.
              </span>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}