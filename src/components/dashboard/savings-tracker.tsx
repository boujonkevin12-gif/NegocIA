import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { mockSavingsGoals } from "@/lib/dashboard-data";
import { Shield, Plane, Car, Plus } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  plane: Plane,
  car: Car,
};

export function SavingsTracker() {
  const totalSaved = mockSavingsGoals.reduce((s, g) => s + g.current, 0);
  const totalTarget = mockSavingsGoals.reduce((s, g) => s + g.target, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Metas de ahorro</CardTitle>
          <button className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3 w-3" />
            Nueva
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total ahorrado</span>
            <span className="text-xs text-muted-foreground">{((totalSaved / totalTarget) * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(totalSaved / totalTarget) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs font-semibold tabular-nums">{formatCurrency(totalSaved)}</span>
            <span className="text-[10px] text-muted-foreground">de {formatCurrency(totalTarget)}</span>
          </div>
        </div>

        {mockSavingsGoals.map((goal) => {
          const progress = (goal.current / goal.target) * 100;
          const remaining = goal.target - goal.current;
          const Icon = iconMap[goal.icon] || Shield;

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${goal.color}15` }}
                >
                  <span style={{ color: goal.color }}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{goal.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(goal.current)} de {formatCurrency(goal.target)}
                  </p>
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: goal.color }}>
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary ml-11">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: goal.color }}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            Te faltan {formatCurrency(mockSavingsGoals.reduce((s, g) => s + (g.target - g.current), 0))} para alcanzar todas tus metas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
