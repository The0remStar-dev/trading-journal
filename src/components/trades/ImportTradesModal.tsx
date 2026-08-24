"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ImportTradesModalProps {
  onSuccess?: () => void;
}

export function ImportTradesModal({ onSuccess }: ImportTradesModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/trades/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setMessage(
        `Import terminé : ${data.importedCount || 0} trade(s) ajouté(s), ${data.duplicateCount || 0} doublon(s) ignoré(s).`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setMessage(`Erreur : ${err.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv, .xlsx, .xls"
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
      >
        {loading ? "Importation..." : "Importer CSV / XLSX"}
      </Button>

      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
}