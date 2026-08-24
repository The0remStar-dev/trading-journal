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
import { cn } from "@/lib/utils";

interface ImportTradesModalProps {
  /** Appelé après un import réussi, pour rafraîchir le tableau des trades. */
  onSuccess?: () => void;
}

type ImportStatus = "idle" | "loading" | "success" | "error";

interface ImportResult {
  imported: number;
  duplicates: number;
  total: number;
}

export function ImportTradesModal({ onSuccess }: ImportTradesModalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setStatus("idle");
    setErrorMessage(null);
    setResult(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetState();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("loading");
    setErrorMessage(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/trades/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Une erreur est survenue lors de l'import.");
        return;
      }

      setStatus("success");
      setResult({ imported: data.imported, duplicates: data.duplicates, total: data.total });
      onSuccess?.();
    } catch {
      setStatus("error");
      setErrorMessage("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      // Permet de réimporter le même fichier si besoin
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="subtle" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Importer Fichier
      </Button>

      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Importer des trades</DialogTitle>
          <DialogDescription>
            Formats acceptés : .csv, .xlsx, .xls ou .zip (export de courtier). Les doublons sont
            détectés et ignorés automatiquement.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.zip"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "loading"}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background py-10 text-center transition-colors",
            status !== "loading" && "cursor-pointer hover:border-accent/50",
            status === "loading" && "cursor-not-allowed opacity-70"
          )}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <span className="text-sm text-muted">Importation...</span>
            </>
          ) : (
            <>
              <FileUp className="h-6 w-6 text-muted" />
              <span className="text-sm text-foreground">Cliquez pour sélectionner un fichier</span>
              <span className="text-xs text-muted">.csv, .xlsx, .xls, .zip</span>
            </>
          )}
        </button>

        {status === "success" && result && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-win/30 bg-win-dim px-4 py-3 text-sm text-win">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {result.imported} trade{result.imported > 1 ? "s" : ""} importé
              {result.imported > 1 ? "s" : ""} avec succès
              {result.duplicates > 0 &&
                ` (${result.duplicates} doublon${result.duplicates > 1 ? "s" : ""} ignoré${
                  result.duplicates > 1 ? "s" : ""
                })`}
              .
            </span>
          </div>
        )}

        {status === "error" && errorMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-loss/30 bg-loss-dim px-4 py-3 text-sm text-loss">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}