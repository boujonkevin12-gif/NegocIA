"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Check } from "lucide-react";

interface Subscription {
  id: string;
  name: string;
  icon: string;
  amount: number;
  frequency: string;
  lastUsedAt: string | null;
  active: boolean;
}

const formatARS = (n: number) =>
  "$" + Math.round(n).toLocaleString("es-AR");

const freqLabel: Record<string, string> = {
  WEEKLY: "/sem",
  MONTHLY: "/mes",
  QUARTERLY: "/trim",
  YEARLY: "/año",
};

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function Subscriptions({ subscriptions }: { subscriptions: Subscription[] }) {
  const router = useRouter();

  if (subscriptions.length === 0) return null;

  const totalMonthly = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => {
      const amt = Number(s.amount);
      switch (s.frequency) {
        case "WEEKLY": return sum + amt * 4;
        case "QUARTERLY": return sum + amt / 3;
        case "YEARLY": return sum + amt / 12;
        default: return sum + amt;
      }
    }, 0);

  return (
    <div className="space-y-5 animate-slide-up stagger-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Suscripciones</h2>
        <span className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{formatARS(totalMonthly)}/mes</span>
        </span>
      </div>

      <div className="space-y-2">
        {subscriptions.map((sub) => {
          const days = daysSince(sub.lastUsedAt);
          const unused = days !== null && days > 30;

          return (
            <div
              key={sub.id}
              className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                unused
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border/50 bg-card/50"
              }`}
            >
              <span className="text-xl">{sub.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{sub.name}</span>
                  {unused && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Sin uso
                    </span>
                  )}
                  {!unused && sub.active && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      <Check className="h-2.5 w-2.5" />
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {days !== null
                    ? `Último uso hace ${days} días`
                    : "Sin uso registrado"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums">
                  {formatARS(Number(sub.amount))}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {freqLabel[sub.frequency] || "/mes"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
