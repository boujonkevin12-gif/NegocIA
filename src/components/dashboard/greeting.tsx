"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { mockAccountSummary } from "@/lib/dashboard-data";
import { TrendingUp, TrendingDown, Calendar, Clock } from "lucide-react";

export function DashboardGreeting() {
  const { data: session } = useSession();
  const name = session?.user?.name?.split(" ")[0] || "Usuario";

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Buenas noches";
  if (hour >= 5 && hour < 12) greeting = "Buenos días";
  else if (hour >= 12 && hour < 19) greeting = "Buenas tardes";

  const dateStr = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const balanceChange = ((mockAccountSummary.balance - mockAccountSummary.previousBalance) / mockAccountSummary.previousBalance * 100);
  const isUp = balanceChange > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {greeting}, {name}
        </h2>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {dateStr}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Actualizado hace unos segundos
          </span>
        </div>
      </div>

      <Card className="sm:w-auto w-full">
        <CardContent className="flex items-center gap-4 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Balance del mes</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(mockAccountSummary.balance)}</p>
          </div>
          <Badge variant={isUp ? "success" : "destructive"} className="text-xs">
            {isUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isUp ? "+" : ""}{balanceChange.toFixed(1)}%
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
