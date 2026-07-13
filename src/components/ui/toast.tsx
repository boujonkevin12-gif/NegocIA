"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 3;
const DISMISS_DURATION = 4000;

function variantStyles(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return {
        border: "border-success/30",
        iconBg: "bg-success/15",
        icon: (
          <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case "error":
      return {
        border: "border-destructive/30",
        iconBg: "bg-destructive/15",
        icon: (
          <svg className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    case "info":
      return {
        border: "border-info/30",
        iconBg: "bg-info/15",
        icon: (
          <svg className="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        ),
      };
  }
}

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(t.id), 200);
    }, DISMISS_DURATION);
    return () => clearTimeout(timer);
  }, [t.id, onDismiss]);

  const styles = variantStyles(t.variant);

  return (
    <div
      className={cn(
        "pointer-events-auto w-80 rounded-lg border bg-card p-4 shadow-lg backdrop-blur-sm transition-all duration-200",
        styles.border,
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", styles.iconBg)}>
          {styles.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{t.title}</p>
          {t.description && (
            <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
          )}
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onDismiss(t.id), 200);
          }}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts((prev) => {
      const entry: Toast = { variant: "info", ...options, id };
      const next = [...prev, entry];
      return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
    });
  }, []);

  const ctx = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
