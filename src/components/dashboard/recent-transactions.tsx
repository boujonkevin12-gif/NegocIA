import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { mockTransactions } from "@/lib/dashboard-data";
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Plus } from "lucide-react";

function getTransactionIcon(type: string) {
  switch (type) {
    case "INCOME":
      return <ArrowDownRight className="h-4 w-4 text-success" />;
    case "EXPENSE":
      return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    case "TRANSFER":
      return <ArrowRightLeft className="h-4 w-4 text-info" />;
    default:
      return null;
  }
}

function getBadge(type: string) {
  switch (type) {
    case "INCOME": return <Badge variant="success" className="text-[9px] px-1.5 py-0">Ingreso</Badge>;
    case "EXPENSE": return <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Gasto</Badge>;
    case "TRANSFER": return <Badge variant="info" className="text-[9px] px-1.5 py-0">Transferencia</Badge>;
    default: return null;
  }
}

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimos movimientos</CardTitle>
          <div className="flex items-center gap-2">
            <a href="/dashboard/finances" className="text-[10px] text-primary hover:underline">
              Ver todo
            </a>
            <button className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-3 w-3" />
              Nuevo
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {mockTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary/50 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary shrink-0">
                {getTransactionIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  {getBadge(tx.type)}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {tx.category} · {formatRelativeTime(tx.date)}
                </p>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums shrink-0 ${
                  tx.amount > 0 ? "text-success" : "text-foreground"
                }`}
              >
                {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
