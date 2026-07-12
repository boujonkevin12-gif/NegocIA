"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockMonthlyData } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/utils";

export function IncomeExpenseChart() {
  const activeMonths = mockMonthlyData.filter((m) => m.income > 0);
  const maxValue = Math.max(...activeMonths.map((m) => Math.max(m.income, m.expenses)));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <span className="text-[10px] text-muted-foreground">Ingresos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="text-[10px] text-muted-foreground">Gastos</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 h-44">
          {mockMonthlyData.map((m, i) => {
            const incomeH = maxValue > 0 ? (m.income / maxValue) * 100 : 0;
            const expenseH = maxValue > 0 ? (m.expenses / maxValue) * 100 : 0;
            const hasData = m.income > 0;

            return (
              <div key={m.month} className="flex flex-1 items-end gap-[2px] group relative">
                {hasData ? (
                  <>
                    <div
                      className="flex-1 rounded-t-sm bg-success/70 transition-all duration-300 hover:bg-success cursor-pointer"
                      style={{ height: `${incomeH}%`, minHeight: incomeH > 0 ? "4px" : "0" }}
                    />
                    <div
                      className="flex-1 rounded-t-sm bg-destructive/30 transition-all duration-300 hover:bg-destructive/60 cursor-pointer"
                      style={{ height: `${expenseH}%`, minHeight: expenseH > 0 ? "4px" : "0" }}
                    />
                  </>
                ) : (
                  <div className="flex-1 h-1 rounded-t-sm bg-secondary/50" />
                )}

                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="rounded-lg bg-card border border-border px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                    <p className="text-[10px] font-medium text-foreground">{m.month}</p>
                    {hasData && (
                      <div className="space-y-0.5 mt-0.5">
                        <p className="text-[10px] text-success">+{formatCurrency(m.income)}</p>
                        <p className="text-[10px] text-destructive">-{formatCurrency(m.expenses)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5 mt-2">
          {mockMonthlyData.map((m) => (
            <div key={m.month} className="flex-1 text-center">
              <span className="text-[10px] text-muted-foreground">{m.month}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Promedio ingresos</p>
            <p className="text-sm font-semibold text-success tabular-nums">
              {formatCurrency(Math.round(activeMonths.reduce((s, m) => s + m.income, 0) / activeMonths.length))}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Promedio gastos</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(Math.round(activeMonths.reduce((s, m) => s + m.expenses, 0) / activeMonths.length))}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Promedio ahorro</p>
            <p className="text-sm font-semibold text-primary tabular-nums">
              {formatCurrency(Math.round(activeMonths.reduce((s, m) => s + m.savings, 0) / activeMonths.length))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
