"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE" | "LEAD";
}

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "ACTIVE", label: "Activos" },
  { key: "INACTIVE", label: "Inactivos" },
  { key: "LEAD", label: "Leads" },
] as const;

const STATUS_MAP: Record<Client["status"], { label: string; variant: "success" | "secondary" | "warning" | "info" }> = {
  ACTIVE: { label: "Activo", variant: "success" },
  INACTIVE: { label: "Inactivo", variant: "secondary" },
  LEAD: { label: "Lead", variant: "warning" },
};

const EMPTY_FORM = { name: "", email: "", phone: "", notes: "", status: "ACTIVE" as Client["status"] };

export default function ClientsPage() {
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) throw new Error();
      setClients(await res.json());
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({ name: client.name, email: client.email ?? "", phone: client.phone ?? "", notes: client.notes ?? "", status: client.status });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const url = editing ? `/api/clients/${editing.id}` : "/api/clients";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          notes: form.notes.trim() || null,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast({ title: editing ? "Cliente actualizado" : "Cliente creado", variant: "success" });
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message || "Ocurrió un error", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Cliente eliminado", variant: "success" });
      setDeleteTarget(null);
      fetchClients();
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el cliente", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestioná tu cartera de clientes"
        action={{ label: "Nuevo Cliente", onClick: openCreate, icon: <Plus className="h-4 w-4" /> }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : clients.length === 0 ? (
        <EmptyState
          title="No hay clientes"
          description={search || statusFilter !== "all" ? "No se encontraron clientes con esos filtros" : "Empezá agregando tu primer cliente"}
          action={!search && statusFilter === "all" ? { label: "Nuevo Cliente", onClick: openCreate } : undefined}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{client.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{client.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{client.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_MAP[client.status].variant}>{STATUS_MAP[client.status].label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(client)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing ? "Editar Cliente" : "Nuevo Cliente"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre del cliente"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 11 0000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Client["status"] })}
                  className="flex h-10 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                  <option value="LEAD">Lead</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notas sobre el cliente..."
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Guardando..." : editing ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Eliminar cliente"
        description={`¿Seguro que querés eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmText={deleting ? "Eliminando..." : "Eliminar"}
        variant="danger"
      />
    </div>
  );
}
