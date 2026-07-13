"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
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
} from "lucide-react";

interface ProviderOption {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const BANK_PROVIDERS: ProviderOption[] = [
  { id: "mercadopago", name: "Mercado Pago", icon: <Wallet className="h-6 w-6" /> },
  { id: "cuentadni", name: "Cuenta DNI", icon: <CreditCard className="h-6 w-6" /> },
  { id: "naranjax", name: "Naranja X", icon: <CreditCard className="h-6 w-6" /> },
  { id: "uala", name: "Ualá", icon: <Wallet className="h-6 w-6" /> },
  { id: "personalpay", name: "Personal Pay", icon: <Wallet className="h-6 w-6" /> },
  { id: "prex", name: "Prex", icon: <CreditCard className="h-6 w-6" /> },
  { id: "galicia", name: "Banco Galicia", icon: <Building2 className="h-6 w-6" /> },
  { id: "nacion", name: "Banco Nación", icon: <Building2 className="h-6 w-6" /> },
  { id: "santander", name: "Banco Santander", icon: <Building2 className="h-6 w-6" /> },
  { id: "bbva", name: "Banco BBVA", icon: <Building2 className="h-6 w-6" /> },
  { id: "macro", name: "Banco Macro", icon: <Building2 className="h-6 w-6" /> },
  { id: "provincia", name: "Banco Provincia", icon: <Building2 className="h-6 w-6" /> },
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

type View = "list" | "select-provider" | "form";

const STATUS_CONFIG: Record<Connection["status"], { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  ACTIVE: { label: "Activa", variant: "success" },
  PENDING: { label: "Pendiente", variant: "warning" },
  ERROR: { label: "Error", variant: "destructive" },
  EXPIRED: { label: "Expirada", variant: "secondary" },
  DISCONNECTED: { label: "Desconectada", variant: "secondary" },
};

export default function BanksPage() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption | null>(null);
  const [label, setLabel] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [credentials, setCredentials] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null);

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

  function handleSelectProvider(provider: ProviderOption) {
    setSelectedProvider(provider);
    setLabel(`Mi cuenta ${provider.name}`);
    setAccessToken("");
    setCredentials("");
    setView("form");
  }

  async function handleConnect() {
    if (!selectedProvider) return;

    const creds: Record<string, string> = {};
    if (selectedProvider.id === "mercadopago") {
      if (!accessToken.trim()) {
        toast({ title: "Error", description: "Ingresá el access token", variant: "error" });
        return;
      }
      creds.access_token = accessToken.trim();
    } else {
      if (!credentials.trim()) {
        toast({ title: "Error", description: "Ingresá las credenciales", variant: "error" });
        return;
      }
      try {
        const parsed = JSON.parse(credentials);
        Object.assign(creds, parsed);
      } catch {
        toast({ title: "Error", description: "Las credenciales deben ser JSON válido", variant: "error" });
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          label: label.trim() || selectedProvider.name,
          credentials: creds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al conectar");
      }

      toast({ title: "Conectada", description: `${selectedProvider.name} conectada correctamente`, variant: "success" });
      setView("list");
      setSelectedProvider(null);
      await fetchConnections();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al conectar la cuenta",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/connections/${id}/sync`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al sincronizar");
      }
      toast({ title: "Sincronizada", description: "Datos actualizados correctamente", variant: "success" });
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
      await fetchConnections();
    } catch {
      toast({ title: "Error", description: "No se pudo desconectar la cuenta", variant: "error" });
    }
  }

  function getProviderName(providerId: string): string {
    return BANK_PROVIDERS.find((p) => p.id === providerId)?.name ?? providerId;
  }

  const bankConnections = connections.filter((c) => c.providerType === "BANK" && c.status !== "DISCONNECTED");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bancos y Billeteras"
        description="Conectá tus cuentas bancarias y billeteras para sincronizar movimientos."
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
                onClick={() => handleSelectProvider(provider)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {provider.icon}
                </div>
                <span className="text-sm font-medium text-foreground">{provider.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "form" && selectedProvider && (
        <div className="space-y-4 animate-fade-in">
          <Button variant="ghost" size="sm" onClick={() => setView("select-provider")}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {selectedProvider.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedProvider.name}</p>
                  <p className="text-xs text-muted-foreground">Conexión con credenciales</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Etiqueta</label>
                <Input
                  placeholder="Mi cuenta Galicia"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              {selectedProvider.id === "mercadopago" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Access Token</label>
                  <Input
                    type="password"
                    placeholder="Ingresá tu access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Credenciales (JSON)</label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    placeholder={'{\n  "api_key": "...",\n  "api_secret": "..."\n}'}
                    value={credentials}
                    onChange={(e) => setCredentials(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={handleConnect} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
                  Conectar
                </Button>
                <Button variant="outline" onClick={() => setView("select-provider")} disabled={submitting}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
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
              description="Conectá tu primera cuenta bancaria para empezar a sincronizar movimientos."
              action={{ label: "Conectar cuenta", onClick: () => setView("select-provider") }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bankConnections.map((conn) => {
                const statusCfg = STATUS_CONFIG[conn.status] ?? STATUS_CONFIG.PENDING;
                return (
                  <Card key={conn.id}>
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{conn.label}</p>
                          <p className="text-xs text-muted-foreground">{getProviderName(conn.providerId)}</p>
                        </div>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </div>

                      {conn.lastError && (
                        <p className="text-xs text-destructive line-clamp-2">{conn.lastError}</p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {conn.lastSyncAt
                          ? `Última sync: ${formatDate(conn.lastSyncAt)}`
                          : "Sin sincronizar"}
                      </p>

                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(conn.id)}
                          disabled={syncingId === conn.id}
                        >
                          {syncingId === conn.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Sincronizar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(conn)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Desconectar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
