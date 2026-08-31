// filepath: src/components/settings/AvatarUpload.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentUrl: string | null;
  /** Ex: profile.updatedAt — invalide le cache navigateur au rendu, sans jamais
   *  être persisté dans l'URL stockée en base. */
  version?: string;
  onUpload: (file: File) => Promise<string>;
  onError: (message: string) => void;
}

export function AvatarUpload({ currentUrl, version, onUpload, onError }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const displayUrl =
    localPreview ?? (currentUrl ? `${currentUrl}${version ? `?v=${version}` : ""}` : null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setBroken(false);
    setUploading(true);

    try {
      await onUpload(file);
    } catch (err) {
      setLocalPreview(null);
      onError(err instanceof Error ? err.message : "Échec de l'upload de l'avatar.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-background">
        {displayUrl && !broken ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Camera className="h-6 w-6" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:border-accent/50",
            uploading && "cursor-not-allowed opacity-60"
          )}
        >
          Changer la photo
        </button>
        <p className="mt-1 text-xs text-muted">JPG, PNG ou WebP — 3 Mo max.</p>
      </div>
    </div>
  );
}