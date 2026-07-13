"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonTable, SkeletonStats } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, TrendingUp, DollarSign, BarChart3, Trophy, X, Pencil, Trash2, ShoppingCart } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
}

interface Sale {
  id: string;
  clientId?: string | null;
  productId?: string | null;
  amount: number;
  quantity: number;
  description?: string | null;
  date: string;
  client?: Client | null;
  product?: Product | null;
}

interface FormData {
  clientId: string;
  productId: string;
  amount: string;
  quantity: string;
  description: string;
  date: string;
}

const EMPTY_FORM: FormData = {
  clientId: "",
  productId: "",
  amount: "",
  quantity: "1",
  description: "",
  date: "",
};

function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SalesPage() {
  const { toast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toLocalDate(d);
  });
  const [dateTo, setDateTo] = useState(() => toLocalDate(new Date()));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo + "T23:59:59.999Z");
      const res = await fetch(`/api/sales?${params}`);
      if (!res.ok) throw new Error("Error al cargar ventas");
      setSales(await res.json());
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las ventas", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.ok && r.json()).then(setClients).catch(() => {});
    fetch("/api/products?active=true").then((r) => r.ok && r.json()).then(setProducts).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    if (sales.length === 0) return { total: 0, avg: 0, count: 0, bestDay: "—" };
    const total = sales.reduce((s, v) => s + Number(v.amount), 0);
    const avg = total / sales.length;
    const dayMap: Record<string, number> = {};
    for (const v of sales) {
      const key = new Date(v.date).toLocaleDateString("es-AR");
      dayMap[key] = (dayMap[key] || 0) + Number(v.amount);
    }
    const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { total, avg, count: sales.length, bestDay };
  }, [sales]);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: toLocalDate(new Date()) });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(sale: Sale) {
    setEditingId(sale.id);
    setForm({
      clientId: sale.clientId || "",
      productId: sale.productId || "",
      amount: String(sale.amount),
      quantity: String(sale.quantity),
      description: sale.description || "",
      date: toLocalDate(new Date(sale.date)),
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormErrors({});
  }

  function handleProductChange(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const qty = parseInt(form.quantity, 10) || 1;
      setForm({
        ...form,
        productId,
        amount: String(Number(product.price) * qty),
      });
    } else {
      setForm({ ...form, productId, amount: "" });
    }
  }

  function handleQuantityChange(qty: string) {
    setForm((prev) => {
      const product = products.find((p) => p.id === prev.productId);
      if (product && qty) {
        const q = parseInt(qty, 10) || 1;
        return { ...prev, quantity: qty, amount: String(Number(product.price) * q) };
      }
      return { ...prev, quantity: qty };
    });
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormData, string>> = {};
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errors.amount = "El monto debe ser mayor a 0";
    if (!form.date) errors.date = "La fecha es requerida";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        clientId: form.clientId || null,
        productId: form.productId || null,
        amount: parseFloat(form.amount),
        quantity: parseInt(form.quantity, 10) || 1,
        description: form.description.trim() || null,
        date: form.date ? new Date(form.date).toISOString() : undefined,
      };
      const url = editingId ? `/api/sales/${editingId}` : "/api/sales";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      toast({ title: editingId ? "Venta actualizada" : "Venta registrada", variant: "success" });
      closeModal();
      fetchSales();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/sales/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast({ title: "Venta eliminada", variant: "success" });
      setDeleteId(null);
      fetchSales();
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar la venta", variant: "error" });
    }
  }

  const selectedProduct = products.find((p) => p.id === form.productId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Registrá y analizá tus ventas"
        action={{ label: "Nueva Venta", onClick: openNew, icon: <Plus className="h-4 w-4" /> }}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Desde</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Hasta</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
        </div>
        <Button variant="outline" size="sm" onClick={() => { setDateFrom(toLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))); setDateTo(toLocalDate(new Date())); }}>
          Este mes
        </Button>
      </div>

      {loading ? (
        <>
          <SkeletonStats />
          <SkeletonTable rows={5} />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<DollarSign className="h-5 w-5 text-primary" />} label="Total ventas" value={formatCurrency(stats.total)} />
            <StatCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label="Promedio" value={formatCurrency(stats.avg)} />
            <StatCard icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Cantidad" value={String(stats.count)} />
            <StatCard icon={<Trophy className="h-5 w-5 text-primary" />} label="Mejor día" value={stats.bestDay} />
          </div>

          {sales.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="h-8 w-8 text-primary" />}
              title="Sin ventas"
              description="No se registraron ventas en este período. Registrá una venta para comenzar."
              action={{ label: "Nueva Venta", onClick: openNew }}
            />
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Monto</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Cant.</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(sale.date)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{sale.client?.name || <span className="italic opacity-50">—</span>}</td>
                        <td className="px-4 py-3 text-muted-foreground">{sale.product?.name || <span className="italic opacity-50">—</span>}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">{formatCurrency(Number(sale.amount))}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{sale.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(sale)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(sale.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? "Editar Venta" : "Nueva Venta"}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Cliente</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sin cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Producto</label>
                  <select
                    value={form.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Sin producto</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(Number(p.price))})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Monto *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className={formErrors.amount ? "border-destructive" : ""}
                  />
                  {formErrors.amount && <p className="text-xs text-destructive mt-1">{formErrors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Cantidad</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                  />
                </div>
              </div>

              {selectedProduct && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 text-xs text-muted-foreground">
                  Precio unitario: <span className="font-semibold text-foreground">{formatCurrency(Number(selectedProduct.price))}</span>
                  {" "}· Stock: <span className="font-semibold text-foreground">{selectedProduct.stock}</span>
                  {selectedProduct.category && (
                    <> · Categoría: <span className="font-semibold text-foreground">{selectedProduct.category}</span></>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Fecha</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={formErrors.date ? "border-destructive" : ""}
                />
                {formErrors.date && <p className="text-xs text-destructive mt-1">{formErrors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Notas sobre la venta..."
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Registrar Venta"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="¿Eliminar venta?"
        description="Se devolverá el stock del producto si correspondiera. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
