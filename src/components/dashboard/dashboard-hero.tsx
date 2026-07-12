"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageSquare, TrendingUp, TrendingDown } from "lucide-react";

interface Insight {
  id: string;
  icon: string;
  text: string;
  type: "opportunity" | "warning" | "info" | "success" | "tip";
}

interface FinancialAnalysisProps {
  balance: number;
  previousBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

const typeStyles: Record<string, string> = {
  opportunity: "border-l-emerald-500 bg-emerald-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  info: "border-l-blue-500 bg-blue-500/5",
  success: "border-l-emerald-500 bg-emerald-500/5",
  tip: "border-l-blue-500 bg-blue-500/5",
};

export function DashboardHero({
  insights,
  balance,
  previousBalance,
  monthlyIncome,
  monthlyExpenses,
}: {
  insights: Insight[];
} & FinancialAnalysisProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const name = session?.user?.name?.split(" ")[0] || "Usuario";

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Buenas noches";
  if (hour >= 5 && hour < 12) greeting = "Buenos días";
  else if (hour >= 12 && hour < 19) greeting = "Buenas tardes";

  const formatARS = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

  const change =
    previousBalance > 0
      ? ((balance - previousBalance) / previousBalance) * 100
      : 0;
  const isUp = change >= 0;
  const hasData = monthlyIncome > 0 || monthlyExpenses > 0;

  return (
    <div className="animate-fade-in">
      <div className="rounded-2xl border border-border/50 bg-card/30 p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {name} 👋
          </h1>
          {insights.length > 0 && (
            <p className="text-lg text-muted-foreground">
              Hoy encontré{" "}
              <span className="font-semibold text-foreground">
                {insights.length} {insights.length === 1 ? "oportunidad" : "oportunidades"}
              </span>{" "}
              para vos.
            </p>
          )}
        </div>

        {insights.length > 0 && (
          <div className="space-y-2.5">
            {insights.map((insight, i) => (
              <div
                key={insight.id}
                className={`flex items-start gap-3 rounded-xl border border-l-4 p-4 animate-slide-up stagger-${i + 1} ${typeStyles[insight.type]}`}
              >
                <span className="mt-0.5 text-lg shrink-0">{insight.icon}</span>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {hasData && (
          <div className="flex flex-wrap items-center gap-6 text-sm pt-2 border-t border-border/50">
            <div>
              <p className="text-muted-foreground text-xs">Balance</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold tabular-nums">
                  {formatARS(balance)}
                </p>
                {previousBalance > 0 && (
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      isUp ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isUp ? "+" : ""}
                    {change.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div>
              <p className="text-muted-foreground text-xs">Ingresos</p>
              <p className="font-semibold text-success">
                {formatARS(monthlyIncome)}
              </p>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div>
              <p className="text-muted-foreground text-xs">Gastos</p>
              <p className="font-semibold text-destructive">
                {formatARS(monthlyExpenses)}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => router.push("/dashboard/chat")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
        >
          <MessageSquare className="h-4 w-4" />
          Ver recomendaciones
        </button>
      </div>
    </div>
  );
}
