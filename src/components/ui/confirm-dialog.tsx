"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

function variantButtonStyle(variant: ConfirmVariant) {
  switch (variant) {
    case "danger":
      return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
    case "warning":
      return "bg-warning text-black hover:bg-warning/90";
    case "info":
      return "bg-primary text-primary-foreground hover:bg-primary/90";
  }
}

function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "info",
}: ConfirmDialogProps) {
  const [visible, setVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  React.useEffect(() => {
    if (visible) confirmRef.current?.focus();
  }, [visible]);

  React.useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onConfirm, onCancel]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onCancel}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl transition-all duration-200",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]",
              variantButtonStyle(variant)
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps, ConfirmVariant };
