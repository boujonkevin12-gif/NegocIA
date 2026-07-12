"use client";

import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";

interface Discovery {
  id: string;
  icon: string;
  text: string;
  type: "warning" | "tip" | "success" | "info";
}

const typeStyles: Record<string, string> = {
  warning: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",
  tip: "border-primary/20 bg-primary/5 hover:border-primary/40",
  success: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40",
  info: "border-border hover:border-primary/30",
};

export function Discoveries({ discoveries }: { discoveries: Discovery[] }) {
  const router = useRouter();

  if (discoveries.length === 0) return null;

  return (
    <div className="space-y-5 animate-slide-up stagger-5">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 px-3 py-1">
          <Flame className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-semibold tracking-tight">Descubrimientos</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          HOY
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        NegocIA encontró esto hoy
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {discoveries.map((d, i) => (
          <button
            key={d.id}
            onClick={() =>
              router.push(
                `/dashboard/chat?q=${encodeURIComponent("Contame más sobre: " + d.text)}`
              )
            }
            className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-300 hover:shadow-md animate-slide-up stagger-${i + 1} ${typeStyles[d.type]}`}
          >
            <span className="mt-0.5 text-xl shrink-0">{d.icon}</span>
            <p className="text-sm leading-relaxed text-foreground/80 group-hover:text-foreground transition-colors">
              {d.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
