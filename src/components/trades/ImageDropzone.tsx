"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Endpoint d'upload ciblé. Par défaut, celui des captures de trade. */
  uploadUrl?: string;
}

export function ImageDropzone({ label, value, onChange, uploadUrl = "/api/upload" }: ImageDropzoneProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        if (uploadUrl === "/api/upload") {
          // Route legacy : accepte un data URI JSON (base64 ou Cloudinary).
          const dataUri = await fileToDataUri(file);
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUri }),
          });
          const data = await res.json();
          onChange(data.url);
        } else {
          // Routes Supabase Storage (ex: posts) : upload via FormData.
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(uploadUrl, { method: "POST", body: formData });
          const data = await res.json();
          onChange(data.url);
        }
      } finally {
        setUploading(false);
      }
    },
    [onChange, uploadUrl]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-border">
          <img src={value} alt={label} className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background text-center transition-colors",
            isDragActive && "border-accent bg-accent/5"
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-muted" />
              <span className="text-xs text-muted">Drag & drop or click to upload</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}