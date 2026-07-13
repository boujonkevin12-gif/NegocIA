"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  Landmark,
  RefreshCw,
  Trash2,
  Plus,
  ArrowLeft,
  Loader2,
  CreditCard,
  Wallet,
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CircleDollarSign,
} from "lucide-react";

interface ProviderOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  authType: "oauth" | "credentials";
}

const BANK_PROVIDERS: ProviderOption[] = [
  { id: "mercadopago", name: "Mercado Pago", icon: <Wallet className="h-6 w-6" />, description: "Conectá tu cuenta de Mercado Pago", authType: "oauth" },
  { id: "cuentadni", name: "Cuenta DNI", icon: <CreditCard className="h-6 w-6" />, description: "Billetera virtual del Banco Nación", authType: "credentials" },
  { id: "naranjax", name: "Naranja X", icon: <CreditCard className="h-6 w-6" />, description: "Tarjeta y billetera Naranja X", authType: "credentials" },
  { id: "uala", name: "Ualá", icon: <Wallet className="h-6 w-6" />, description: "Cuenta digital Ualá", authType: "credentials" },
  { id: "personalpay", name: "Personal Pay", icon: <Wallet className="h-6 w-6" />, description: "Billetera de Personal", authType: "credentials" },
  { id: "prex", name: "Prex", icon: <CreditCard className="h-6 w-6" />, description: "Tarjeta y cuenta Prex", authType: "credentials" },
  { id: "galicia", name: "Banco Galicia", icon: <Building2 className="h-6 w-6" />, description: "Cuenta del Banco Galicia", authType: "credentials" },
  { id: "nacion", name: "Banco Nación", icon: <Building2 className="h-6 w-6" />, description: "Cuenta del Banco Nación", authType: "credentials" },
  { id: "santander", name: "Banco Santander", icon: <Building2 className="h-6 w-6" />, description: "Cuenta del Banco Santander", authType: "credentials" },
  { id: "bbva", name: "Banco BBVA", icon: <Building2 className="h-6 w-6" />, description: "Cuenta del Banco BBVA", authType: "credentials" },
  { id: "macro", name: "Banco Macro", icon: <Building2 className="h-6 w-6" />, description: "Cuenta del Banco Macro", authType: "credentials" },
  { id: "provincia", name: "Banco Provincia", icon: <Building2 className="h-6 w-6" />, description: "Cuenta del Banco Provincia", authType: "credentials" },
];

interface Connection {
  id: string;
  providerId: string;
  providerType: string;
  label: string;
  status: "ACTIVE" | "PENDING" | "ERROR" | "EXPIRED" | "DISCONNECTED";
  lastSyncAt: string | null;
  lastError: string | null;
  createdAt: string;
}

interface MPSyncStats {
  totalPayments: number;
  totalAmount: number;
  todayCount: number;
  todayAmount: number;
  weekCount: number;
  weekAmount: number;
  monthCount: number;
  monthAmount: number;
  approved: number;
  pending: number;
  rejected: number;
  refunded: number;
}

interface MPPayment {
  id: number;
  status: string;
  statusDetail: string;
  amount: number;
  currency: string;
  description: string;
  dateCreated: string;
  dateApproved: string | null;
  type: string;
  method: string;
  collectorEmail: string;
}

interface MPSyncData {
  syncedAt: string;
  user: { id: number; firstName: string; lastName: string; email: string; siteId: string } | null;
  stats: MPSyncStats;
  recentPayments: MPPayment[];
  limitations: { balance: string; investments: string };
}

type View = "list" | "select-provider";

const STATUS_CONFIG: Record<Connection["status"], { label: string; variant: "success" | "warning" | "destructive" | "secondary"; icon: React.ReactNode }> = {
  ACTIVE: { label: "Conectada", variant: "success", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  PENDING: { label: "Pendiente", variant: "warning", icon: <Clock className="h-3.5 w-3.5" /> },
  ERROR: { label: "Error", variant: "destructive", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  EXPIRED: { label: "Expirada", variant: "secondary", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  DISCONNECTED: { label: "Desconectada", variant: "secondary", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

const PAYMENT_STATUS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  approved: { label: "Aprobado", variant: "success" },
  pending: { label: "Pendiente", variant: "warning" },
  rejected: { label: "Rechazado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "secondary" },
  in_process: { label: "En proceso", variant: "warning" },
  authorized: { label: "Autorizado", variant: "success" },
};

const PAYMENT_TYPE: Record<string, string> = {
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  bank_transfer: "Transferencia",
  cash: "Efectivo",
  account_money: "Billetera MP",
  ticket: "Ticket/Cupón",
  prepaid_card: "Tarjeta prepaga",
  atm: "Cajero automático",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BanksPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null);
  const [mpData, setMpData] = useState<MPSyncData | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      toast({
        title: "Cuenta conectada",
        description: `${connected === "mercadopago" ? "Mercado Pago" : connected} conectada correctamente`,
        variant: "success",
      });
      window.history.replaceState({}, "", "/dashboard/banks");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: "Faltan parámetros de autorización",
        mp_not_configured: "Mercado Pago no está configurado en el servidor",
        token_exchange_failed: "Error al intercambiar el código de autorización",
        callback_failed: "Error al procesar la autorización",
      };
      toast({
        title: "Error de conexión",
        description: errorMessages[error] || "Error desconocido al conectar",
        variant: "error",
      });
      window.history.replaceState({}, "", "/dashboard/banks");
    }
  }, [searchParams, toast]);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (!res.ok) throw new Error("Error al cargar conexiones");
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las conexiones", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  function handleConnect(provider: ProviderOption) {
    if (provider.authType === "oauth") {
      setConnecting(provider.id);
      window.location.href = `/api/connections/${provider.id}/auth`;
    } else {
      toast({
        title: "Próximamente",
        description: `La conexión con ${provider.name} estará disponible pronto`,
        variant: "info",
      });
    }
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    try {
      const conn = connections.find((c) => c.id === id);
      if (conn?.providerId === "mercadopago") {
        const res = await fetch("/api/connections/mercadopago/sync", { method: "POST" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al sincronizar");
        }
        const data = await res.json();
        setMpData(data);
        toast({ title: "Sincronizado", description: "Datos de MercadoPago actualizados", variant: "success" });
      } else {
        const res = await fetch(`/api/connections/${id}/sync`, { method: "POST" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al sincronizar");
        }
        toast({ title: "Sincronizada", description: "Datos actualizados correctamente", variant: "success" });
      }
      await fetchConnections();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al sincronizar",
        variant: "error",
      });
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDisconnect() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/connections/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al desconectar");
      toast({ title: "Desconectada", description: `${deleteTarget.label} desconectada`, variant: "success" });
      setDeleteTarget(null);
      if (deleteTarget.providerId === "mercadopago") setMpData(null);
      await fetchConnections();
    } catch {
      toast({ title: "Error", description: "No se pudo desconectar la cuenta", variant: "error" });
    }
  }

  function getProviderName(providerId: string): string {
    return BANK_PROVIDERS.find((p) => p.id === providerId)?.name ?? providerId;
  }

  function getProviderIcon(providerId: string): React.ReactNode {
    const provider = BANK_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return <Landmark className="h-6 w-6" />;
    return provider.icon;
  }

  const bankConnections = connections.filter((c) => c.providerType === "BANK" && c.status !== "DISCONNECTED");
  const mpConnection = bankConnections.find((c) => c.providerId === "mercadopago");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bancos y Billeteras"
        description="Conectá tus cuentas bancarias para sincronizar movimientos automáticamente."
        action={
          view === "list"
            ? { label: "Conectar cuenta", onClick: () => setView("select-provider"), icon: <Plus className="h-4 w-4" /> }
            : undefined
        }
      />

      {view === "select-provider" && (
        <div className="space-y-4 animate-fade-in">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BANK_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleConnect(provider)}
                disabled={connecting === provider.id}
                className="flex items-start gap-4 rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
                  style={{ background: "rgba(124, 58, 237, 0.1)" }}
                >
                  {connecting === provider.id ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <span className="text-primary">{provider.icon}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{provider.name}</span>
                    {provider.authType === "oauth" && (
                      <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                        <Shield className="h-2.5 w-2.5" />
                        Seguro
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                  {provider.authType === "oauth" && (
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-primary">
                      <ExternalLink className="h-3 w-3" />
                      <span>Conectar con {provider.name}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(124, 58, 237, 0.05)", border: "1px solid rgba(124, 58, 237, 0.1)" }}
          >
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Conexión segura</p>
              <p className="text-xs text-muted-foreground">
                Tus credenciales están encriptadas y nunca se almacenan en texto plano. Solo se utilizan para sincronizar tus movimientos.
              </p>
            </div>
          </div>
        </div>
      )}

      {view === "list" && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                      <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                      <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bankConnections.length === 0 ? (
            <EmptyState
              icon={<Landmark className="h-8 w-8 text-primary" />}
              title="Sin cuentas conectadas"
              description="Conectá tu primera cuenta bancaria para empezar a sincronizar movimientos automáticamente."
              action={{ label: "Conectar cuenta", onClick: () => setView("select-provider") }}
            />
          ) : (
            <div className="space-y-6">
              {bankConnections.map((conn) => {
                const statusCfg = STATUS_CONFIG[conn.status] ?? STATUS_CONFIG.PENDING;
                const isMP = conn.providerId === "mercadopago";
                const stats = mpData?.stats;

                return (
                  <div key={conn.id} className="space-y-4">
                    <div
                      className="rounded-2xl p-5 transition-all duration-200"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0"
                          style={{ background: "rgba(124, 58, 237, 0.1)" }}
                        >
                          <span className="text-primary">{getProviderIcon(conn.providerId)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-base font-semibold text-white">{conn.label}</p>
                            <Badge variant={statusCfg.variant} className="flex items-center gap-1">
                              {statusCfg.icon}
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{getProviderName(conn.providerId)}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              {conn.lastSyncAt
                                ? `Última sync: ${new Date(conn.lastSyncAt).toLocaleDateString("es-AR")} ${new Date(conn.lastSyncAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
                                : "Sin sincronizar"}
                            </span>
                            <span>•</span>
                            <span>
                              Conectada: {new Date(conn.createdAt).toLocaleDateString("es-AR")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(conn.id)}
                            disabled={syncingId === conn.id}
                            className="rounded-xl"
                          >
                            {syncingId === conn.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">Sincronizar ahora</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                            onClick={() => setDeleteTarget(conn)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {conn.lastError && (
                        <div
                          className="mt-3 rounded-xl p-3 flex items-start gap-2"
                          style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)" }}
                        >
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <p className="text-xs text-destructive">{conn.lastError}</p>
                        </div>
                      )}
                    </div>

                    {isMP && stats && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <StatCard
                            icon={<BarChart3 className="h-4 w-4" />}
                            label="Cobros totales"
                            value={String(stats.totalPayments)}
                            sub={formatCurrency(stats.totalAmount)}
                            color="primary"
                          />
                          <StatCard
                            icon={<Calendar className="h-4 w-4" />}
                            label="Hoy"
                            value={String(stats.todayCount)}
                            sub={formatCurrency(stats.todayAmount)}
                            color="success"
                          />
                          <StatCard
                            icon={<TrendingUp className="h-4 w-4" />}
                            label="Esta semana"
                            value={String(stats.weekCount)}
                            sub={formatCurrency(stats.weekAmount)}
                            color="info"
                          />
                          <StatCard
                            icon={<DollarSign className="h-4 w-4" />}
                            label="Este mes"
                            value={String(stats.monthCount)}
                            sub={formatCurrency(stats.monthAmount)}
                            color="warning"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <MiniStat label="Aprobados" value={stats.approved} variant="success" />
                          <MiniStat label="Pendientes" value={stats.pending} variant="warning" />
                          <MiniStat label="Rechazados" value={stats.rejected} variant="destructive" />
                          <MiniStat label="Reembolsados" value={stats.refunded} variant="secondary" />
                        </div>

                        <div
                          className="rounded-xl p-3 flex items-start gap-2"
                          style={{ background: "rgba(124, 58, 237, 0.05)", border: "1px solid rgba(124, 58, 237, 0.1)" }}
                        >
                          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong className="text-white">Saldo:</strong> {mpData.limitations.balance}</p>
                            <p><strong className="text-white">Inversiones:</strong> {mpData.limitations.investments}</p>
                          </div>
                        </div>

                        {mpData.recentPayments.length > 0 && (
                          <div
                            className="rounded-2xl overflow-hidden"
                            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
                          >
                            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--glass-border)" }}>
                              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <CircleDollarSign className="h-4 w-4 text-primary" />
                                Últimos cobros
                              </h3>
                            </div>
                            <div className="divide-y" style={{ borderColor: "var(--glass-border)" }}>
                              {mpData.recentPayments.map((p) => {
                                const statusCfg = PAYMENT_STATUS[p.status] ?? { label: p.status, variant: "secondary" as const };
                                return (
                                  <div
                                    key={p.id}
                                    className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                                  >
                                    <div
                                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                                      style={{
                                        background: p.status === "approved"
                                          ? "rgba(34, 197, 94, 0.1)"
                                          : p.status === "pending"
                                          ? "rgba(234, 179, 8, 0.1)"
                                          : "rgba(239, 68, 68, 0.1)",
                                      }}
                                    >
                                      {p.status === "approved" ? (
                                        <ArrowUpRight className="h-4 w-4 text-success" />
                                      ) : p.status === "pending" ? (
                                        <Clock className="h-4 w-4 text-warning" />
                                      ) : (
                                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-white truncate">
                                          {p.description || "Pago"}
                                        </p>
                                        <Badge variant={statusCfg.variant} className="text-[10px] shrink-0">
                                          {statusCfg.label}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">
                                          {PAYMENT_TYPE[p.type] ?? p.type}
                                        </span>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatShortDate(p.dateCreated)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <p className={`text-sm font-semibold ${p.status === "approved" ? "text-success" : p.status === "pending" ? "text-warning" : "text-destructive"}`}>
                                        {p.status === "approved" ? "+" : ""}{formatCurrency(p.amount)}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {p.currency}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Última sincronización: {mpData.syncedAt ? formatShortDate(mpData.syncedAt) : "—"}
                          </span>
                          {mpData.user && (
                            <span>
                              {mpData.user.firstName} {mpData.user.lastName} • {mpData.user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={handleDisconnect}
        onCancel={() => setDeleteTarget(null)}
        title="Desconectar cuenta"
        description={`¿Querés desconectar "${deleteTarget?.label ?? ""}"? Se perderán los datos de sincronización pendientes.`}
        confirmText="Desconectar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "rgba(124, 58, 237, 0.1)",
    success: "rgba(34, 197, 94, 0.1)",
    info: "rgba(59, 130, 246, 0.1)",
    warning: "rgba(234, 179, 8, 0.1)",
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: colorMap[color] ?? colorMap.primary }}
        >
          <span className={`text-${color}`}>{icon}</span>
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value, variant }: { label: string; value: number; variant: string }) {
  const variantColor: Record<string, string> = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    secondary: "text-muted-foreground",
  };

  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
    >
      <p className={`text-lg font-bold ${variantColor[variant] ?? "text-white"}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
