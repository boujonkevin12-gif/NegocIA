import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { mockAccountSummary, categoryBreakdown } from "@/lib/dashboard-data";
import { Wallet, TrendingUp, PiggyBank, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from "lucide-react";

function CircleProgress({ segments }: { segments: { color: string; percentage: number }[] }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
      {segments.map((seg, i) => {
        const dashArray = (seg.percentage / 100) * circumference;
        const dashOffset = -(accumulated / 100) * circumference;
        accumulated += seg.percentage;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="8"
            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function BalanceOverview() {
  const data = mockAccountSummary;
  const totalExpenses = Math.abs(data.expenses);
  const savingsPercent = ((data.savings / data.income) * 100).toFixed(0);

  const segments = [
    { color: "#22c55e", percentage: (data.income / data.income) * 100 },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Resumen financiero</CardTitle>
          <span className="text-xs text-muted-foreground">Julio 2026</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-center">
          <CircleProgress segments={segments} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Ingresos</span>
            </div>
            <p className="text-sm font-semibold text-success tabular-nums">{formatCurrency(data.income)}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Gastos</span>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Ahorros</span>
            </div>
            <p className="text-sm font-semibold text-primary tabular-nums">{formatCurrency(data.savings)}</p>
            <span className="text-[10px] text-muted-foreground">{savingsPercent}% del ingreso</span>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">Inversiones</span>
            </div>
            <p className="text-sm font-semibold text-warning tabular-nums">{formatCurrency(data.investments)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Dónde va tu dinero</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary flex">
            {categoryBreakdown.slice(0, 5).map((cat) => (
              <div
                key={cat.name}
                className="h-full transition-all"
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                title={`${cat.name}: ${formatCurrency(cat.amount)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {categoryBreakdown.slice(0, 5).map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] text-muted-foreground">{cat.name} {cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
