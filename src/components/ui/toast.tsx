"use client";

import { CheckCircle2, XCircle, X } from "lucide-react";
import { ToastContext, useToastState } from "@/lib/useToast";
import { cn } from "@/lib/utils";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, toast, dismiss } = useToastState();

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex w-80 items-start gap-2 rounded-md border px-4 py-3 shadow-lg animate-fade-in",
              t.variant === "success" && "border-win/30 bg-surface text-foreground",
              t.variant === "error" && "border-loss/30 bg-surface text-foreground"
            )}
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-win" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}