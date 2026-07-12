"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Wallet,
  TrendingUp,
  Calculator,
  BarChart3,
  Lightbulb,
  PiggyBank,
  Receipt,
  ArrowUp,
  Loader2,
} from "lucide-react";

const suggestions = [
  { label: "¿Cuánto gasté este mes?", icon: Wallet },
  { label: "Analizá mis inversiones", icon: TrendingUp },
  { label: "Calculá impuestos", icon: Calculator },
  { label: "Haceme un resumen financiero", icon: BarChart3 },
  { label: "Dame un consejo de ahorro", icon: Lightbulb },
  { label: "Arma mi presupuesto", icon: PiggyBank },
  { label: "¿Cuál es mi tasa de ahorro?", icon: Receipt },
];

interface ChatEmptyProps {
  onSend: (message: string) => void;
  loading: boolean;
}

export function ChatEmpty({ onSend, loading }: ChatEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">NegocIA</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
        Tu asistente financiero inteligente. Preguntame lo que quieras sobre
        tus finanzas, inversiones, gastos o metas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-2xl w-full">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onSend(s.label)}
            disabled={loading}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary/50 hover:text-foreground disabled:opacity-50"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <s.icon className="h-3.5 w-3.5" />
            </div>
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
