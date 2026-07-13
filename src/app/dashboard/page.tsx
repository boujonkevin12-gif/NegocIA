"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SkeletonStats } from "@/components/dashboard/skeleton-stats";
import {
  DollarSign,
  Users,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Megaphone,
  Rocket,
  Scale,
  Calculator,
  Activity,
  Clock,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";

const advisors = [
  { label: "Finanzas", sublabel: "Mejorá tus finanzas", icon: Calculator, color: "#22C55E", q: "¿Cómo puedo mejorar mis finanzas?" },
  { label: "Inversiones", sublabel: "Analizá tu portafolio", icon: TrendingUp, color: "#3B82F6", q: "Analiza mis inversiones" },
  { label: "Marketing", sublabel: "Ideas y estrategias", icon: Megaphone, color: "#EC4899", q: "Dame ideas de marketing" },
  { label: "Negocios", sublabel: "Hacé crecer tu negocio", icon: Rocket, color: "#F97316", q: "Cómo hacer crecer mi negocio" },
  { label: "Legal", sublabel: "Situación legal", icon: Scale, color: "#8B5CF6", q: "Revisá mi situación legal" },
  { label: "Contabilidad", sublabel: "Organizá tu contabilidad", icon: MessageSquare, color: "#06B6D4", q: "Ayudame con la contabilidad" },
];

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  clientCount: number;
  activeProductCount: number;
  lowStockProductsCount: number;
  pendingAppointmentCount: number;
  monthlyTrend: { month: string; total: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const userName = session?.user?.name || "Usuario";

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/connections/auto-sync", { method: "POST" }).catch(() => {});
  }, []);

  const kpis = stats
    ? [
        {
          label: "Ventas del mes",
          value: `$${(stats.totalIncome || 0).toLocaleString("es-AR")}`,
          change: "+12.5%",
          positive: true,
          icon: DollarSign,
          color: "#22C55E",
        },
        {
          label: "Clientes",
          value: String(stats.clientCount || 0),
          change: "+3",
          positive: true,
          icon: Users,
          color: "#3B82F6",
        },
        {
          label: "Turnos pendientes",
          value: String(stats.pendingAppointmentCount || 0),
          change: "Hoy",
          positive: true,
          icon: Calendar,
          color: "#F59E0B",
        },
        {
          label: "Stock bajo",
          value: String(stats.lowStockProductsCount || 0),
          change: stats.lowStockProductsCount > 0 ? "Atención" : "OK",
          positive: stats.lowStockProductsCount === 0,
          icon: Package,
          color: stats.lowStockProductsCount > 0 ? "#EF4444" : "#22C55E",
        },
      ]
    : [];

  const maxTrend = Math.max(...(stats?.monthlyTrend?.map((m) => m.total) || [1]));

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Buenos días"
      : currentHour < 19
      ? "Buenas tardes"
      : "Buenas noches";

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {greeting}, {userName}
        </h1>
        <p className="text-muted-foreground text-sm">
          Este es tu resumen financiero de hoy.
        </p>
      </div>

      {loading ? (
        <SkeletonStats />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, i) => (
              <div
                key={kpi.label}
                className={`kpi-card animate-fade-in stagger-${i + 1}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `${kpi.color}15` }}
                  >
                    <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {kpi.positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className={kpi.positive ? "text-success" : "text-destructive"}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {kpi.value}
                </div>
                <div className="text-sm text-muted-foreground">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Chart + AI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart */}
            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Ingresos</h2>
                  <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-success font-medium">+18%</span>
                  <span className="text-muted-foreground">vs mes anterior</span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-3 h-48">
                {stats?.monthlyTrend?.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      ${m.total > 1000 ? `${Math.round(m.total / 1000)}k` : m.total}
                    </span>
                    <div
                      className="chart-bar w-full"
                      style={{
                        height: `${Math.max((m.total / maxTrend) * 100, 4)}%`,
                      }}
                    />
                    <span className="text-[11px] text-muted-foreground">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Activity */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-white">Actividad IA</h2>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Clock, text: "Análisis de gastos completado", time: "Hace 2 min", color: "#22C55E" },
                  { icon: AlertTriangle, text: "Stock bajo en 3 productos", time: "Hace 15 min", color: "#F59E0B" },
                  { icon: ShoppingCart, text: "Nueva venta registrada", time: "Hace 1 hora", color: "#3B82F6" },
                  { icon: Users, text: "2 nuevos clientes hoy", time: "Hace 2 horas", color: "#8B5CF6" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5"
                      style={{ background: `${item.color}15` }}
                    >
                      <item.icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90 truncate">{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Center */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Centro IA</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {advisors.map((a) => (
                <button
                  key={a.q}
                  onClick={() => router.push(`/dashboard/chat?q=${encodeURIComponent(a.q)}`)}
                  className="glass rounded-2xl p-4 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 group"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl mb-3 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${a.color}15` }}
                  >
                    <a.icon className="h-5 w-5" style={{ color: a.color }} />
                  </div>
                  <div className="text-sm font-medium text-white mb-0.5">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{a.sublabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom: Appointments + Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Appointments */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">Próximos turnos</h2>
                <button
                  onClick={() => router.push("/dashboard/appointments")}
                  className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Ver todos
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Consulta general", client: "María García", time: "10:00", status: "confirmed" },
                  { name: "Reunión de trabajo", client: "Pedro López", time: "14:30", status: "scheduled" },
                  { name: "Seguimiento", client: "Ana Martínez", time: "16:00", status: "confirmed" },
                ].map((apt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-white/5"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {apt.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{apt.name}</p>
                      <p className="text-xs text-muted-foreground">{apt.client}</p>
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        apt.status === "confirmed"
                          ? "bg-success/15 text-success"
                          : "bg-info/15 text-info"
                      }`}
                    >
                      {apt.status === "confirmed" ? "Confirmado" : "Pendiente"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">Más vendidos</h2>
                <button
                  onClick={() => router.push("/dashboard/products")}
                  className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Ver todos
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Producto A", sold: 45, revenue: "$125.000" },
                  { name: "Producto B", sold: 32, revenue: "$89.000" },
                  { name: "Producto C", sold: 28, revenue: "$67.500" },
                ].map((prod, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-white/5"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{prod.name}</p>
                      <p className="text-xs text-muted-foreground">{prod.sold} vendidos</p>
                    </div>
                    <span className="text-sm font-semibold text-white">{prod.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
