import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

interface Investment {
  id: string;
  name: string;
  type: string;
  symbol?: string;
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  status: "ACTIVE" | "SOLD";
}

const mockInvestments: Investment[] = [
  { id: "1", name: "YPF", type: "Stock", symbol: "YPF", buyPrice: 12500, currentPrice: 14200, quantity: 200, status: "ACTIVE" },
  { id: "2", name: "Bitcoin", type: "Crypto", symbol: "BTC", buyPrice: 9500000, currentPrice: 10200000, quantity: 0.19, status: "ACTIVE" },
  { id: "3", name: "Plazo Fijo UVA", type: "Plazo Fijo", buyPrice: 900000, currentPrice: 950000, quantity: 1, status: "ACTIVE" },
  { id: "4", name: "FCI Renta Fija", type: "Fondo", buyPrice: 600000, currentPrice: 620000, quantity: 1, status: "ACTIVE" },
  { id: "5", name: "Ethereum", type: "Crypto", symbol: "ETH", buyPrice: 3200000, currentPrice: 2800000, quantity: 0.5, status: "ACTIVE" },
  { id: "6", name: "Galicia", type: "Stock", symbol: "GGAL", buyPrice: 8500, currentPrice: 11200, quantity: 300, status: "ACTIVE" },
];

function getProfit(buyPrice: number, currentPrice: number, quantity: number) {
  return (currentPrice - buyPrice) * quantity;
}

function getProfitPercent(buyPrice: number, currentPrice: number) {
  return ((currentPrice - buyPrice) / buyPrice) * 100;
}

function getTypeColor(type: string) {
  switch (type) {
    case "Stock": return "bg-blue-500/10 text-blue-400";
    case "Crypto": return "bg-orange-500/10 text-orange-400";
    case "Plazo Fijo": return "bg-green-500/10 text-green-400";
    case "Fondo": return "bg-purple-500/10 text-purple-400";
    default: return "bg-secondary text-muted-foreground";
  }
}

export default function InvestmentsPage() {
  const totalValue = mockInvestments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);
  const totalCost = mockInvestments.reduce((sum, inv) => sum + inv.buyPrice * inv.quantity, 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = ((totalValue - totalCost) / totalCost) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inversiones</h2>
          <p className="text-muted-foreground">Seguí el rendimiento de tu portfolio.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Nueva inversión
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Valor del portfolio</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Inversión total</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Ganancia/Pérdida</p>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}>
                {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
              </p>
              <Badge variant={totalProfit >= 0 ? "success" : "destructive"}>
                {totalProfit >= 0 ? "+" : ""}{totalProfitPercent.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis inversiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {mockInvestments.map((inv) => {
              const profit = getProfit(inv.buyPrice, inv.currentPrice, inv.quantity);
              const profitPct = getProfitPercent(inv.buyPrice, inv.currentPrice);
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 rounded-lg px-4 py-4 transition-colors hover:bg-secondary/50"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getTypeColor(inv.type)}`}>
                    <span className="text-xs font-bold">{inv.symbol?.slice(0, 2) || inv.type.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{inv.name}</p>
                      <Badge variant="outline" className="text-[10px]">{inv.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {inv.quantity} {inv.symbol ? inv.symbol : "unidad(es)"} · Compra: {formatCurrency(inv.buyPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(inv.currentPrice * inv.quantity)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      {profit >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`text-xs font-medium ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                        {profit >= 0 ? "+" : ""}{formatCurrency(profit)} ({profitPct >= 0 ? "+" : ""}{profitPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
