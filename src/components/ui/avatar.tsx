"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-12 w-12" } as const;

interface AvatarProps {
  src: string | null;
  alt: string;
  /** Ex : date de mise à jour du profil, pour invalider le cache navigateur. */
  version?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ src, alt, version, size = "md", className }: AvatarProps) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const url = src && version ? `${src}?v=${encodeURIComponent(version)}` : src;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary",
        SIZES[size],
        className
      )}
    >
      {url && !broken ? (
        <img src={url} alt={alt} className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <User className="h-1/2 w-1/2 text-muted" />
      )}
    </div>
  );
}