"use client";

import { createContext, useCallback, useContext, useState } from "react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error";
}

interface ToastContextValue {
  toasts: ToastMessage[];
  toast: (msg: Omit<ToastMessage, "id">) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastState() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (msg: Omit<ToastMessage, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...msg, id }]);
      // Auto-dismiss après 4 secondes
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return { toasts, toast, dismiss };
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé à l'intérieur de <ToastProvider>.");
  return ctx;
}