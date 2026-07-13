"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  Building2,
  User,
  CreditCard,
  Link2,
  Save,
  ExternalLink,
  Check,
  Crown,
  Zap,
  Star,
  Clock,
  Loader2,
} from "lucide-react";

interface BusinessProfile {
  id?: string;
  businessName: string;
  logoUrl: string | null;
  cuit: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  openingHours: string | null;
}

interface UserPlan {
  tier: string;
  status: string;
  plan: {
    name: string;
    description: string;
    priceLabel: string;
    features: string[];
  };
}

interface Connection {
  id: string;
  providerId: string;
  providerType: string;
  label: string;
  status: "ACTIVE" | "PENDING" | "ERROR" | "EXPIRED" | "DISCONNECTED";
  lastSyncAt: string | null;
}

const DAYS = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
] as const;

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

type OpeningHours = Record<string, DaySchedule>;

function defaultOpeningHours(): OpeningHours {
  const result: Partial<OpeningHours> = {};
  for (const day of DAYS) {
    result[day.key] = { open: "09:00", close: "18:00", closed: day.key === "sun" };
  }
  return result as OpeningHours;
}

function parseOpeningHours(raw: string | null): OpeningHours {
  if (!raw) return defaultOpeningHours();
  try {
    const parsed = JSON.parse(raw);
    const result: Partial<OpeningHours> = {};
    for (const day of DAYS) {
      if (parsed[day.key]) {
        result[day.key] = {
          open: parsed[day.key].open || "09:00",
          close: parsed[day.key].close || "18:00",
          closed: !!parsed[day.key].closed,
        };
      } else {
        result[day.key] = { open: "09:00", close: "18:00", closed: false };
      }
    }
    return result as OpeningHours;
  } catch {
    return defaultOpeningHours();
  }
}

function ConnectionStatusBadge({ status }: { status: Connection["status"] }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "info" | "secondary" }> = {
    ACTIVE: { label: "Conectado", variant: "success" },
    PENDING: { label: "Pendiente", variant: "warning" },
    ERROR: { label: "Error", variant: "destructive" },
    EXPIRED: { label: "Expirado", variant: "destructive" },
    DISCONNECTED: { label: "Desconectado", variant: "secondary" },
  };
  const info = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

function PlanIcon({ tier }: { tier: string }) {
  if (tier === "PREMIUM") return <Crown className="h-5 w-5 text-yellow-400" />;
  if (tier === "PRO") return <Zap className="h-5 w-5 text-primary" />;
  return <Star className="h-5 w-5 text-muted-foreground" />;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: "",
    logoUrl: null,
    cuit: null,
    address: null,
    phone: null,
    email: null,
    website: null,
    description: null,
    openingHours: null,
  });
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours());
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, planRes, connRes] = await Promise.all([
        fetch("/api/business-profile"),
        fetch("/api/billing/status"),
        fetch("/api/connections"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data) {
          setProfile({
            businessName: data.businessName || "",
            logoUrl: data.logoUrl || null,
            cuit: data.cuit || null,
            address: data.address || null,
            phone: data.phone || null,
            email: data.email || null,
            website: data.website || null,
            description: data.description || null,
            openingHours: data.openingHours || null,
          });
          setOpeningHours(parseOpeningHours(data.openingHours));
        }
      }

      if (planRes.ok) {
        const data = await planRes.json();
        setUserPlan(data);
      }

      if (connRes.ok) {
        const data = await connRes.json();
        setConnections(data.connections || []);
      }

      // Attempt to get user info from session
      try {
        const meRes = await fetch("/api/auth/session");
        if (meRes.ok) {
          const sessionData = await meRes.json();
          if (sessionData?.user) {
            setUserName(sessionData.user.name || "");
            setUserEmail(sessionData.user.email || "");
          }
        }
      } catch {
        // Ignore - user info is optional
      }
    } catch {
      toast({
        title: "Error al cargar configuración",
        description: "No se pudieron obtener los datos.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSave = async () => {
    if (!profile.businessName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "El nombre del negocio es obligatorio.",
        variant: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          openingHours: JSON.stringify(openingHours),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      toast({
        title: "Perfil guardado",
        description: "La configuración del negocio se actualizó correctamente.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "No se pudo guardar la configuración.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configuración" description="Administrá tu cuenta y preferencias." />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Administrá tu cuenta y preferencias." />

      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Perfil del Negocio</CardTitle>
                <CardDescription>Información general de tu negocio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nombre del negocio <span className="text-destructive">*</span>
                </label>
                <Input
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  placeholder="Mi Negocio"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo URL</label>
                <Input
                  value={profile.logoUrl || ""}
                  onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value || null })}
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CUIT</label>
                <Input
                  value={profile.cuit || ""}
                  onChange={(e) => setProfile({ ...profile, cuit: e.target.value || null })}
                  placeholder="20-12345678-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  value={profile.address || ""}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value || null })}
                  placeholder="Av. Corrientes 1234, Buenos Aires"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value || null })}
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={profile.email || ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value || null })}
                  placeholder="contacto@minegocio.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sitio web</label>
                <Input
                  value={profile.website || ""}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value || null })}
                  placeholder="https://minegocio.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={profile.description || ""}
                onChange={(e) => setProfile({ ...profile, description: e.target.value || null })}
                placeholder="Descripción breve de tu negocio"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Horarios de atención</label>
              </div>
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const schedule = openingHours[day.key];
                  return (
                    <div key={day.key} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                      <span className="w-24 text-sm font-medium shrink-0">{day.label}</span>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule?.closed ?? false}
                          onChange={(e) =>
                            setOpeningHours({
                              ...openingHours,
                              [day.key]: {
                                ...(schedule || { open: "09:00", close: "18:00", closed: false }),
                                closed: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        Cerrado
                      </label>
                      {!schedule?.closed && (
                        <div className="flex items-center gap-2 ml-auto">
                          <Input
                            type="time"
                            value={schedule?.open || "09:00"}
                            onChange={(e) =>
                              setOpeningHours({
                                ...openingHours,
                                [day.key]: {
                                  ...(schedule || { open: "09:00", close: "18:00", closed: false }),
                                  open: e.target.value,
                                },
                              })
                            }
                            className="w-28 h-8 text-xs"
                          />
                          <span className="text-xs text-muted-foreground">a</span>
                          <Input
                            type="time"
                            value={schedule?.close || "18:00"}
                            onChange={(e) =>
                              setOpeningHours({
                                ...openingHours,
                                [day.key]: {
                                  ...(schedule || { open: "09:00", close: "18:00", closed: false }),
                                  close: e.target.value,
                                },
                              })
                            }
                            className="w-28 h-8 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Perfil Personal</CardTitle>
                <CardDescription>Información de tu cuenta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input value={userName} disabled className="opacity-70" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={userEmail} disabled className="opacity-70" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              La información personal se gestiona desde tu cuenta. Próximamente podrás editarla aquí.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Plan Actual</CardTitle>
                <CardDescription>Tu suscripción y beneficios</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {userPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlanIcon tier={userPlan.tier} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{userPlan.plan.name}</span>
                        <Badge variant={userPlan.tier === "FREE" ? "secondary" : "default"}>
                          {userPlan.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{userPlan.plan.description}</p>
                    </div>
                  </div>
                  {userPlan.plan.priceLabel && (
                    <div className="text-right">
                      <p className="text-lg font-bold">{userPlan.plan.priceLabel}</p>
                      <p className="text-xs text-muted-foreground">/mes</p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Incluido en tu plan</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {userPlan.plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {userPlan.tier === "FREE" && (
                  <div className="flex justify-end">
                    <Button onClick={() => window.location.href = "/dashboard"}>
                      <Crown className="h-4 w-4" />
                      Mejorar plan
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Cargando información del plan...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Conexiones</CardTitle>
                <CardDescription>Cuentas bancarias y servicios conectados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <div className="text-center py-6">
                <Link2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No tenés conexiones configuradas.</p>
                <p className="text-xs text-muted-foreground mt-1">Conectá tu cuenta bancaria para sincronizar transacciones automáticamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{conn.label}</p>
                        <ConnectionStatusBadge status={conn.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {conn.providerType} · {conn.lastSyncAt ? `Última sync: ${new Date(conn.lastSyncAt).toLocaleDateString("es-AR")}` : "Nunca sincronizado"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
