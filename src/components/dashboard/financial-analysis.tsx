"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Lightbulb } from "lucide-react";

interface FinancialAnalysisProps {
  balance: number;
  previousBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  insight?: string;
}

export function FinancialAnalysis({
  balance,
  previousBalance,
  monthlyIncome,
  monthlyExpenses,
  insight,
}: FinancialAnalysisProps) {
  const { data: session } = useSession();
  const name = session?.user?.name?.split(" ")[0] || "Usuario";

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Buenas noches";
  if (hour >= 5 && hour < 12) greeting = "Buenos días";
  else if (hour >= 12 && hour < 19) greeting = "Buenas tardes";

  const change = previousBalance > 0
    ? ((balance - previousBalance) / previousBalance) * 100
    : 0;
  const isUp = change >= 0;

  const savingsRate = monthlyIncome > 0
    ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
    : 0;

  const investable = Math.max(0, monthlyIncome * 0.3 - monthlyExpenses * 0);

  const formatARS = (n: number) =>
    "$" + Math.round(n).toLocaleString("es-AR");

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {name} 👋
        </h1>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saldo disponible</p>
              <p className="text-4xl font-bold tracking-tight tabular-nums">
                {formatARS(balance)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                {isUp ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={isUp ? "text-success" : "text-destructive"}>
                  {isUp ? "+" : ""}
                  {change.toFixed(1)}% respecto al mes pasado
                </span>
              </div>
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Ingresos</p>
                <p className="font-semibold text-success">{formatARS(monthlyIncome)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gastos</p>
                <p className="font-semibold text-destructive">{formatARS(monthlyExpenses)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ahorro</p>
                <p className="font-semibold">{savingsRate}%</p>
              </div>
            </div>
          </div>

          {insight && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-foreground/80">{insight}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
