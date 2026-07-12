import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Filter } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: string;
  date: string;
}

const mockTransactions: Transaction[] = [
  { id: "1", description: "Salario mensual", amount: 850000, type: "INCOME", category: "Salario", date: "2026-07-01" },
  { id: "2", description: "Alquiler departamento", amount: -180000, type: "EXPENSE", category: "Vivienda", date: "2026-07-03" },
  { id: "3", description: "Transferencia a ahorros", amount: -200000, type: "TRANSFER", category: "Ahorros", date: "2026-07-05" },
  { id: "4", description: "Freelance diseño web", amount: 150000, type: "INCOME", category: "Freelance", date: "2026-07-06" },
  { id: "5", description: "Supermercado", amount: -45000, type: "EXPENSE", category: "Alimentos", date: "2026-07-07" },
  { id: "6", description: "Netflix + Spotify", amount: -8500, type: "EXPENSE", category: "Entretenimiento", date: "2026-07-08" },
  { id: "7", description: "Gimnasio", amount: -15000, type: "EXPENSE", category: "Salud", date: "2026-07-09" },
  { id: "8", description: "Venta MercadoLibre", amount: 35000, type: "INCOME", category: "Venta", date: "2026-07-10" },
  { id: "9", description: "Gas + Luz", amount: -12000, type: "EXPENSE", category: "Servicios", date: "2026-07-11" },
  { id: "10", description: "Café y almuerzo", amount: -9200, type: "EXPENSE", category: "Alimentos", date: "2026-07-12" },
];

function getTransactionIcon(type: Transaction["type"]) {
  switch (type) {
    case "INCOME":
      return <ArrowDownRight className="h-4 w-4 text-success" />;
    case "EXPENSE":
      return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    case "TRANSFER":
      return <ArrowRightLeft className="h-4 w-4 text-info" />;
  }
}

export default function FinancesPage() {
  const totalIncome = mockTransactions.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(mockTransactions.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finanzas</h2>
          <p className="text-muted-foreground">Controlá todos tus movimientos financieros.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Nueva transacción
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Ingresos del mes</p>
            <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Gastos del mes</p>
            <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalIncome - totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transacciones</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {mockTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  {getTransactionIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.category} · {formatDate(tx.date)}</p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
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
    </div>
  );
}
