import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockFinancialGoals } from "@/lib/dashboard-data";
import { Target, ArrowUpRight } from "lucide-react";

function getPriorityBadge(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Alta</Badge>;
    case "medium":
      return <Badge variant="warning" className="text-[9px] px-1.5 py-0">Media</Badge>;
    case "low":
      return <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Baja</Badge>;
  }
}

function getPriorityColor(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high": return "#ef4444";
    case "medium": return "#f59e0b";
    case "low": return "#71717a";
  }
}

export function FinancialGoals() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Objetivos financieros</CardTitle>
          <a href="/dashboard/settings" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
            Editar <ArrowUpRight className="h-2.5 w-2.5" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockFinancialGoals.map((goal) => (
          <div key={goal.id} className="rounded-lg border border-border p-3 space-y-2 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{goal.title}</p>
                  {getPriorityBadge(goal.priority)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{goal.description}</p>
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: getPriorityColor(goal.priority) }}>
                {goal.progress}%
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor: getPriorityColor(goal.priority),
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Meta: {goal.target}</span>
              <span className="text-[10px] text-muted-foreground">{goal.deadline}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
