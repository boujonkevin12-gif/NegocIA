"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Upload,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PiggyBank,
  AlertTriangle,
  Lightbulb,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Clock,
  X,
  Sparkles,
  RefreshCw,
  Download,
} from "lucide-react";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface Recommendation {
  title: string;
  description: string;
  potentialSaving: number;
}

interface FinancialData {
  balance: { estimated: number; income: number; expenses: number; savings: number };
  monthlyTrend: MonthlyData[];
  topCategories: CategoryBreakdown[];
  subscriptions: { name: string; monthlyCost: number; annualCost: number }[];
  recommendations: Recommendation[];
  lastImport: { date: string; source: string; rows: number } | null;
}

interface ImportResult {
  ok: boolean;
  importId: string;
  rowsTotal: number;
  rowsImported: number;
  rowsSkipped: number;
  dateRange: { from: string; to: string } | null;
  topCategories: { category: string; amount: number }[];
}

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? "-" : "";
  return `${prefix}$${Math.round(abs).toLocaleString("es-AR")}`;
}

export default function FinancialPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "recommendations">("overview");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/financial/dashboard");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      console.error("Error loading financial data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Error", description: "Solo se aceptan archivos CSV", variant: "error" });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "mercadopago_csv");

      const res = await fetch("/api/financial/import", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al importar");
      }

      setImportResult(result);
      toast({
        title: "Importación completada",
        description: `${result.rowsImported} movimientos importados, ${result.rowsSkipped} duplicados omitidos`,
        variant: "success",
      });

      await fetchData();
    } catch (err) {
      toast({
        title: "Error de importación",
        description: err instanceof Error ? err.message : "Error al procesar el archivo",
        variant: "error",
      });
    } finally {
      setImporting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const currentMonth = data?.monthlyTrend?.[data.monthlyTrend.length - 1];
  const prevMonth = data?.monthlyTrend?.[data.monthlyTrend.length - 2];
  const monthlyChange = currentMonth && prevMonth && prevMonth.expenses > 0
    ? ((currentMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100
    : 0;

  const totalSavingPotential = data?.recommendations?.reduce((s, r) => s + r.potentialSaving, 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centro Financiero"
        description="Vista consolidada de todas tus finanzas en un solo lugar."
        action={{
          label: importing ? "Importando..." : "Importar CSV",
          onClick: () => fileInputRef.current?.click(),
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileInput}
      />

      {!data && !loading && (
        <div
          className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-white/10 hover:border-white/20"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Importá tu primer reporte
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Descargá el reporte de &quot;Dinero en cuenta&quot; desde Mercado Pago y arrastralo aquí.
                La IA va a analizar automáticamente tus ingresos, gastos y suscripciones.
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="rounded-xl"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Seleccionar archivo CSV
            </Button>
            <p className="text-xs text-muted-foreground">
              Mercado Pago &gt; Reportes &gt; Dinero en cuenta &gt; Generar reporte &gt; Descargar CSV
            </p>
          </div>
        </div>
      )}

      {importResult && (
        <div
          className="rounded-2xl p-5 animate-fade-in"
          style={{ background: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.15)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="text-sm font-semibold text-success">Importación exitosa</h3>
            <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setImportResult(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total filas</p>
              <p className="font-semibold text-white">{importResult.rowsTotal}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Importados</p>
              <p className="font-semibold text-success">{importResult.rowsImported}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duplicados</p>
              <p className="font-semibold text-warning">{importResult.rowsSkipped}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Categorías</p>
              <p className="font-semibold text-white">{importResult.topCategories.length}</p>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-fade-in">
          <div
            className={`rounded-2xl border-2 border-dashed p-6 transition-all duration-200 ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-white/10 hover:border-white/20"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-white">Importar más datos</p>
                  <p className="text-xs text-muted-foreground">Arrastrá un CSV o hacé clic para seleccionar</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data.lastImport && (
                  <span className="text-xs text-muted-foreground">
                    Última importación: {new Date(data.lastImport.date).toLocaleDateString("es-AR")}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="rounded-xl"
                >
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Wallet className="h-5 w-5" />}
              label="Balance estimado"
              value={formatCurrency(data.balance.estimated)}
              color={data.balance.estimated >= 0 ? "success" : "destructive"}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Ingresos"
              value={formatCurrency(data.balance.income)}
              color="success"
            />
            <StatCard
              icon={<TrendingDown className="h-5 w-5" />}
              label="Gastos"
              value={formatCurrency(data.balance.expenses)}
              change={monthlyChange !== 0 ? `${monthlyChange > 0 ? "+" : ""}${Math.round(monthlyChange)}% vs mes anterior` : undefined}
              changePositive={monthlyChange <= 0}
              color="destructive"
            />
            <StatCard
              icon={<PiggyBank className="h-5 w-5" />}
              label="Ahorro"
              value={formatCurrency(data.balance.savings)}
              color={data.balance.savings >= 0 ? "info" : "warning"}
            />
          </div>

          <div className="flex gap-2">
            {(["overview", "categories", "recommendations"] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="rounded-xl"
              >
                {tab === "overview" && <BarChart3 className="h-3.5 w-3.5 mr-1.5" />}
                {tab === "categories" && <CreditCard className="h-3.5 w-3.5 mr-1.5" />}
                {tab === "recommendations" && <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {tab === "overview" ? "Resumen" : tab === "categories" ? "Categorías" : "Recomendaciones"}
              </Button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Tendencia mensual</h3>
                <div className="flex items-end gap-2 h-48">
                  {data.monthlyTrend.map((m) => {
                    const maxVal = Math.max(
                      ...data.monthlyTrend.map((x) => Math.max(x.income, x.expenses)),
                      1
                    );
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end" style={{ height: "100%" }}>
                          <div
                            className="flex-1 rounded-t bg-success/60"
                            style={{ height: `${(m.income / maxVal) * 100}%`, minHeight: m.income > 0 ? 2 : 0 }}
                          />
                          <div
                            className="flex-1 rounded-t bg-destructive/60"
                            style={{ height: `${(m.expenses / maxVal) * 100}%`, minHeight: m.expenses > 0 ? 2 : 0 }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success/60" /> Ingresos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-destructive/60" /> Gastos
                  </span>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Suscripciones detectadas</h3>
                {data.subscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se detectaron suscripciones recurrentes.</p>
                ) : (
                  <div className="space-y-3">
                    {data.subscriptions.map((sub) => (
                      <div key={sub.name} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${Math.round(sub.monthlyCost).toLocaleString("es-AR")}/mes
                          </p>
                        </div>
                        <span className="text-xs text-destructive font-medium">
                          ${Math.round(sub.annualCost).toLocaleString("es-AR")}/año
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Gastos por categoría</h3>
              {data.topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay datos de categorías disponibles.</p>
              ) : (
                <div className="space-y-3">
                  {data.topCategories.map((cat) => (
                    <div key={cat.category} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{cat.category}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(cat.amount)} ({Math.round(cat.percentage)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "recommendations" && (
            <div className="space-y-4">
              {data.recommendations.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Importá más datos para recibir recomendaciones personalizadas de la IA.
                  </p>
                </div>
              ) : (
                <>
                  {totalSavingPotential > 0 && (
                    <div
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{ background: "rgba(124, 58, 237, 0.05)", border: "1px solid rgba(124, 58, 237, 0.15)" }}
                    >
                      <Lightbulb className="h-5 w-5 text-primary shrink-0" />
                      <p className="text-sm text-white">
                        Podrías ahorrar hasta <strong className="text-primary">{formatCurrency(totalSavingPotential)}</strong> aplicando estas recomendaciones.
                      </p>
                    </div>
                  )}
                  {data.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="glass rounded-2xl p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                          style={{ background: "rgba(234, 179, 8, 0.1)" }}
                        >
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white mb-1">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                          {rec.potentialSaving > 0 && (
                            <p className="text-xs text-success mt-2 font-medium">
                              Ahorro potencial: {formatCurrency(rec.potentialSaving)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
                  <div className="h-6 w-32 animate-pulse rounded bg-secondary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  change,
  changePositive,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    success: "rgba(34, 197, 94, 0.1)",
    destructive: "rgba(239, 68, 68, 0.1)",
    info: "rgba(59, 130, 246, 0.1)",
    warning: "rgba(234, 179, 8, 0.1)",
  };

  const textColor: Record<string, string> = {
    success: "text-success",
    destructive: "text-destructive",
    info: "text-info",
    warning: "text-warning",
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: colorMap[color] ?? colorMap.info }}
        >
          <span className={textColor[color] ?? "text-info"}>{icon}</span>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {change && (
        <div className="flex items-center gap-1 mt-1">
          {changePositive ? (
            <ArrowUpRight className="h-3 w-3 text-success" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-destructive" />
          )}
          <span className={`text-xs ${changePositive ? "text-success" : "text-destructive"}`}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
