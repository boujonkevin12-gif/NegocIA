"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard, SkeletonStats } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import {
  Download,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

type Tab = "ventas" | "clientes" | "ingresos" | "stock";

interface Sale {
  id: string;
  amount: number;
  quantity: number;
  description: string | null;
  date: string;
  clientId: string | null;
  productId: string | null;
  client?: { id: string; name: string } | null;
  product?: { id: string; name: string; price: number } | null;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "LEAD";
  createdAt: string;
}

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number | null;
  stock: number;
  minStock: number;
  sku: string | null;
  category: string | null;
  active: boolean;
}

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  clientCount: number;
  activeProductCount: number;
  lowStockProductsCount: number;
  monthlyTrend: { month: string; total: number }[];
  topExpenseCategories: { category: string; total: number }[];
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "ventas", label: "Ventas", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "clientes", label: "Clientes", icon: <Users className="h-4 w-4" /> },
  { key: "ingresos", label: "Ingresos", icon: <DollarSign className="h-4 w-4" /> },
  { key: "stock", label: "Stock", icon: <Package className="h-4 w-4" /> },
];

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <div className="h-6 w-full rounded-md bg-white/5 overflow-hidden">
      <div
        className={`h-full rounded-md transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={`text-xs font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChart({
  data,
  labelKey,
  valueKey,
  color = "bg-primary",
  formatValue = formatCurrency,
}: {
  data: { [key: string]: string | number }[];
  labelKey: string;
  valueKey: string;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey])), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{String(d[labelKey])}</span>
            <span className="font-medium tabular-nums">{formatValue(Number(d[valueKey]))}</span>
          </div>
          <MiniBar value={Number(d[valueKey])} max={max} color={color} />
        </div>
      ))}
    </div>
  );
}

function getSixMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().split("T")[0];
}

function getMonthLabel(date: Date): string {
  return date.toLocaleString("es-AR", { month: "short", year: "numeric" });
}

function getMonthlySales(sales: Sale[]): { month: string; total: number; count: number }[] {
  const now = new Date();
  const months: { month: string; total: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = getMonthLabel(d);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const filtered = sales.filter((s) => {
      const sd = new Date(s.date);
      return sd >= monthStart && sd <= monthEnd;
    });
    months.push({
      month: label,
      total: filtered.reduce((sum, s) => sum + Number(s.amount), 0),
      count: filtered.length,
    });
  }
  return months;
}

function getTopProducts(sales: Sale[]): { name: string; count: number; total: number }[] {
  const map = new Map<string, { name: string; count: number; total: number }>();
  for (const s of sales) {
    if (!s.product) continue;
    const key = s.product.id;
    const existing = map.get(key);
    if (existing) {
      existing.count += s.quantity;
      existing.total += Number(s.amount);
    } else {
      map.set(key, { name: s.product.name, count: s.quantity, total: Number(s.amount) });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

function getMonthlyClients(clients: Client[]): { month: string; count: number }[] {
  const now = new Date();
  const months: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = getMonthLabel(d);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const count = clients.filter((c) => {
      const cd = new Date(c.createdAt);
      return cd >= monthStart && cd <= monthEnd;
    }).length;
    months.push({ month: label, count });
  }
  return months;
}

function getMonthlyBalance(transactions: Transaction[]): { month: string; income: number; expense: number; balance: number }[] {
  const now = new Date();
  const months: { month: string; income: number; expense: number; balance: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = getMonthLabel(d);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const filtered = transactions.filter((t) => {
      const td = new Date(t.date);
      return td >= monthStart && td <= monthEnd;
    });
    const income = filtered
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = filtered
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    months.push({ month: label, income, expense, balance: income - expense });
  }
  return months;
}

function getExpenseCategories(transactions: Transaction[]): { category: string; total: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    map.set(t.category, (map.get(t.category) || 0) + Number(t.amount));
  }
  return Array.from(map.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function getProductsByCategory(products: Product[]): { category: string; count: number; value: number }[] {
  const map = new Map<string, { count: number; value: number }>();
  for (const p of products) {
    const cat = p.category || "Sin categoría";
    const existing = map.get(cat);
    if (existing) {
      existing.count += 1;
      existing.value += Number(p.price) * p.stock;
    } else {
      map.set(cat, { count: 1, value: Number(p.price) * p.stock });
    }
  }
  return Array.from(map.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.value - a.value);
}

function SalesTab({ sales }: { sales: Sale[] }) {
  const [from, setFrom] = useState(getSixMonthsAgo());
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);

  const filtered = sales.filter((s) => {
    const d = new Date(s.date);
    return d >= new Date(from) && d <= new Date(to + "T23:59:59");
  });

  const totalVentas = filtered.reduce((sum, s) => sum + Number(s.amount), 0);
  const promedio = filtered.length > 0 ? totalVentas / filtered.length : 0;
  const monthlyData = getMonthlySales(sales);
  const topProducts = getTopProducts(filtered);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-40" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total ventas"
          value={formatCurrency(totalVentas)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Promedio por venta"
          value={formatCurrency(promedio)}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          label="Cantidad de ventas"
          value={formatNumber(filtered.length)}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ventas por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={monthlyData} labelKey="month" valueKey="total" color="bg-primary" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 5 productos más vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay ventas registradas en este período.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="tabular-nums text-muted-foreground">{formatNumber(p.count)} uds.</span>
                    </div>
                    <MiniBar value={p.total} max={topProducts[0].total} color="bg-primary" />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-28 text-right">{formatCurrency(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            const headers = ["Fecha", "Producto", "Cliente", "Cantidad", "Monto"];
            const rows = filtered.map((s) => [
              formatDate(s.date),
              s.product?.name || "N/A",
              s.client?.name || "Sin cliente",
              String(s.quantity),
              String(Number(s.amount)),
            ]);
            downloadCSV("reporte_ventas.csv", headers, rows);
          }}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}

function ClientsTab({ clients, sales }: { clients: Client[]; sales: Sale[] }) {
  const activos = clients.filter((c) => c.status === "ACTIVE").length;
  const leads = clients.filter((c) => c.status === "LEAD").length;
  const inactivos = clients.filter((c) => c.status === "INACTIVE").length;

  const clientSales = new Map<string, { name: string; count: number; total: number }>();
  for (const s of sales) {
    if (!s.client) continue;
    const key = s.client.id;
    const existing = clientSales.get(key);
    if (existing) {
      existing.count += 1;
      existing.total += Number(s.amount);
    } else {
      clientSales.set(key, { name: s.client.name, count: 1, total: Number(s.amount) });
    }
  }
  const topClients = Array.from(clientSales.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const monthlyClients = getMonthlyClients(clients);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Total clientes"
          value={formatNumber(clients.length)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Activos"
          value={formatNumber(activos)}
          icon={<Users className="h-5 w-5" />}
          color="text-success"
        />
        <StatCard
          label="Leads"
          value={formatNumber(leads)}
          icon={<Users className="h-5 w-5" />}
          color="text-info"
        />
        <StatCard
          label="Inactivos"
          value={formatNumber(inactivos)}
          icon={<Users className="h-5 w-5" />}
          color="text-muted-foreground"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clientes con más compras</CardTitle>
        </CardHeader>
        <CardContent>
          {topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay ventas registradas con clientes.</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="tabular-nums text-muted-foreground">{c.count} compras</span>
                    </div>
                    <MiniBar value={c.total} max={topClients[0].total} color="bg-violet-500" />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-28 text-right">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevos clientes por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={monthlyClients} labelKey="month" valueKey="count" color="bg-violet-500" formatValue={formatNumber} />
        </CardContent>
      </Card>
    </div>
  );
}

function IngresosTab({ transactions }: { transactions: Transaction[] }) {
  const [from, setFrom] = useState(getSixMonthsAgo());
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);

  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= new Date(from) && d <= new Date(to + "T23:59:59");
  });

  const totalIngresos = filtered
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalGastos = filtered
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyBalance = getMonthlyBalance(transactions);
  const expenseCats = getExpenseCategories(filtered);

  const maxCat = expenseCats.length > 0 ? expenseCats[0].total : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-40" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Ingresos totales"
          value={formatCurrency(totalIngresos)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="text-success"
        />
        <StatCard
          label="Gastos totales"
          value={formatCurrency(totalGastos)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="text-destructive"
        />
        <StatCard
          label="Balance"
          value={formatCurrency(totalIngresos - totalGastos)}
          icon={<DollarSign className="h-5 w-5" />}
          color={totalIngresos - totalGastos >= 0 ? "text-success" : "text-destructive"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balance mensual (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyBalance.map((m, i) => {
              const maxVal = Math.max(
                ...monthlyBalance.map((x) => Math.max(x.income, x.expense)),
                1
              );
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{m.month}</span>
                    <span className={`font-medium tabular-nums ${m.balance >= 0 ? "text-success" : "text-destructive"}`}>
                      {m.balance >= 0 ? "+" : ""}{formatCurrency(m.balance)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-success w-12">Ingr.</span>
                      <div className="flex-1 h-3 rounded bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded bg-success/60 transition-all duration-500"
                          style={{ width: `${maxVal > 0 ? (m.income / maxVal) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-destructive w-12">Gast.</span>
                      <div className="flex-1 h-3 rounded bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded bg-destructive/60 transition-all duration-500"
                          style={{ width: `${maxVal > 0 ? (m.expense / maxVal) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top categorías de gastos</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseCats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay gastos en este período.</p>
          ) : (
            <div className="space-y-3">
              {expenseCats.map((c, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{c.category}</span>
                      <span className="tabular-nums text-muted-foreground">{((c.total / totalGastos) * 100).toFixed(1)}%</span>
                    </div>
                    <MiniBar value={c.total} max={maxCat} color="bg-destructive/60" />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-28 text-right">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            const headers = ["Fecha", "Tipo", "Categoría", "Descripción", "Monto"];
            const rows = filtered.map((t) => [
              formatDate(t.date),
              t.type === "INCOME" ? "Ingreso" : t.type === "EXPENSE" ? "Gasto" : "Transferencia",
              t.category,
              t.description,
              String(Number(t.amount)),
            ]);
            downloadCSV("reporte_ingresos.csv", headers, rows);
          }}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}

function StockTab({ products }: { products: Product[] }) {
  const lowStock = products.filter((p) => p.active && p.stock <= p.minStock);
  const totalValue = products
    .filter((p) => p.active)
    .reduce((sum, p) => sum + Number(p.price) * p.stock, 0);
  const byCategory = getProductsByCategory(products.filter((p) => p.active));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Valor total del inventario"
          value={formatCurrency(totalValue)}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          label="Productos con stock bajo"
          value={formatNumber(lowStock.length)}
          icon={<AlertTriangle className="h-5 w-5" />}
          color={lowStock.length > 0 ? "text-warning" : "text-foreground"}
        />
      </div>

      {lowStock.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="text-base text-warning">Stock bajo - Reabastecer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">
                      Stock: {p.stock} / Mín: {p.minStock}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {lowStock.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-sm text-muted-foreground">Todos los productos tienen stock suficiente.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay productos activos.</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((c, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{c.category}</span>
                      <span className="tabular-nums text-muted-foreground">{c.count} productos</span>
                    </div>
                    <MiniBar value={c.value} max={byCategory[0].value} color="bg-primary" />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-28 text-right">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("ventas");
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, clientsRes, txRes, productsRes] = await Promise.all([
        fetch("/api/sales?limit=200"),
        fetch("/api/clients"),
        fetch("/api/transactions?limit=200"),
        fetch("/api/products"),
      ]);

      if (salesRes.ok) setSales(await salesRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch {
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron obtener los datos para los reportes.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Analizá el rendimiento de tu negocio." />

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonStats />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="animate-fade-in">
          {activeTab === "ventas" && <SalesTab sales={sales} />}
          {activeTab === "clientes" && <ClientsTab clients={clients} sales={sales} />}
          {activeTab === "ingresos" && <IngresosTab transactions={transactions} />}
          {activeTab === "stock" && <StockTab products={products} />}
        </div>
      )}
    </div>
  );
}
