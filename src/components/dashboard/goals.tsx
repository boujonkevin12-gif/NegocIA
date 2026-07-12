"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  currency: string;
}

const formatARS = (n: number) =>
  "$" + Math.round(n).toLocaleString("es-AR");

export function Goals({ goals }: { goals: Goal[] }) {
  const router = useRouter();

  return (
    <div className="space-y-5 animate-slide-up stagger-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Objetivos</h2>
        <button
          onClick={() => router.push("/dashboard/chat?q=Quiero crear un nuevo objetivo de ahorro")}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no tenés objetivos.{" "}
            <button
              onClick={() => router.push("/dashboard/chat?q=Quiero crear un objetivo de ahorro")}
              className="text-primary hover:underline"
            >
              Creá uno
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.target > 0
              ? Math.min(100, Math.round((goal.current / goal.target) * 100))
              : 0;

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{goal.icon}</span>
                    <span className="text-sm font-medium">{goal.name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{pct}%</span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatARS(goal.current)}</span>
                  <span>{formatARS(goal.target)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
