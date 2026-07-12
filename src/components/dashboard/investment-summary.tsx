import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { mockInvestments } from "@/lib/dashboard-data";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

function getTypeColor(type: string) {
  switch (type) {
    case "Stock": return { bg: "bg-blue-500/10", text: "text-blue-400" };
    case "Crypto": return { bg: "bg-orange-500/10", text: "text-orange-400" };
    case "Plazo Fijo": return { bg: "bg-green-500/10", text: "text-green-400" };
    case "Fondo": return { bg: "bg-purple-500/10", text: "text-purple-400" };
    default: return { bg: "bg-secondary", text: "text-muted-foreground" };
  }
}

export function InvestmentSummary() {
  const totalValue = mockInvestments.reduce((s, i) => s + i.value, 0);
  const totalCost = mockInvestments.reduce((s, i) => s + i.buyPrice, 0);
  const totalProfit = totalValue - totalCost;
  const profitPercent = ((totalProfit / totalCost) * 100);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Inversiones</CardTitle>
          <a href="/dashboard/investments" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
            Ver todo <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Valor total</span>
            <Badge variant={totalProfit >= 0 ? "success" : "destructive"} className="text-[10px]">
              {profitPercent >= 0 ? "+" : ""}{profitPercent.toFixed(1)}%
            </Badge>
          </div>
          <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(totalValue)}</p>
          <p className={`text-xs mt-0.5 ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}>
            {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)} ganancia
          </p>
        </div>

        <div className="space-y-2.5">
          {mockInvestments.map((inv) => {
            const profit = inv.value - inv.buyPrice;
            const profitPct = ((inv.value - inv.buyPrice) / inv.buyPrice) * 100;
            const colors = getTypeColor(inv.type);

            return (
              <div key={inv.id} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}>
                  <span className={`text-[10px] font-bold ${colors.text}`}>
                    {inv.symbol.slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.name}</p>
                  <p className="text-[10px] text-muted-foreground">{inv.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(inv.value)}</p>
                  <div className="flex items-center gap-1 justify-end">
                    {profit >= 0 ? (
                      <TrendingUp className="h-2.5 w-2.5 text-success" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 text-destructive" />
                    )}
                    <span className={`text-[10px] font-medium ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                      {profitPct >= 0 ? "+" : ""}{profitPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
