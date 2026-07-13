"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Search, Plus, Pencil, Trash2, X, LayoutGrid, List, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  stock: number;
  minStock: number;
  sku: string | null;
  category: string | null;
  active: boolean;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  cost: "",
  stock: "0",
  minStock: "5",
  sku: "",
  category: "",
};

function formatCurrency(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function ProductsPage() {
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("active", "true");
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.map((p: Product) => ({ ...p, price: Number(p.price), cost: p.cost != null ? Number(p.cost) : null })));
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      cost: product.cost != null ? String(product.cost) : "",
      stock: String(product.stock),
      minStock: String(product.minStock),
      sku: product.sku ?? "",
      category: product.category ?? "",
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es requerido";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = "Ingresá un precio válido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: Number(form.price),
          cost: form.cost ? Number(form.cost) : null,
          stock: Number(form.stock) || 0,
          minStock: Number(form.minStock) || 0,
          sku: form.sku.trim() || null,
          category: form.category.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast({ title: editing ? "Producto actualizado" : "Producto creado", variant: "success" });
      setModalOpen(false);
      fetchProducts();
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
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Producto eliminado", variant: "success" });
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el producto", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestioná tu stock y catálogo"
        action={{ label: "Nuevo Producto", onClick: openCreate, icon: <Plus className="h-4 w-4" /> }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
        )}
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setView("grid")}
            className={`rounded-md p-2 transition-colors ${view === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md p-2 transition-colors ${view === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No hay productos"
          description={search || categoryFilter ? "No se encontraron productos con esos filtros" : "Empezá agregando tu primer producto"}
          action={!search && !categoryFilter ? { label: "Nuevo Producto", onClick: openCreate } : undefined}
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const lowStock = product.stock <= product.minStock;
            return (
              <Card key={product.id} className="relative">
                {lowStock && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Stock bajo
                    </Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold truncate pr-20">{product.name}</h3>
                      {product.category && <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>}
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(product.price)}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Stock:{" "}
                        <span className={lowStock ? "font-semibold text-destructive" : "font-medium text-foreground"}>
                          {product.stock}
                        </span>
                      </span>
                      {product.sku && <span>SKU: {product.sku}</span>}
                    </div>
                    <div className="flex justify-end gap-1 pt-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(product)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Categoría</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Precio</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const lowStock = product.stock <= product.minStock;
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{product.name}</p>
                        {product.category && <p className="text-xs text-muted-foreground md:hidden">{product.category}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{product.category || "—"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${lowStock ? "text-destructive" : ""}`}>
                          {product.stock}
                        </span>
                        {lowStock && (
                          <AlertTriangle className="inline ml-1.5 h-3.5 w-3.5 text-destructive" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{product.sku || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(product)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing ? "Editar Producto" : "Nuevo Producto"}</h2>
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
                  placeholder="Nombre del producto"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción del producto..."
                  rows={2}
                  className="flex w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio *</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0"
                  />
                  {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Costo</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock mínimo</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU</label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="SKU-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Ej: Electrónica"
                  />
                </div>
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
        title="Eliminar producto"
        description={`¿Seguro que querés eliminar "${deleteTarget?.name}"? El producto se marcará como inactivo.`}
        confirmText={deleting ? "Eliminando..." : "Eliminar"}
        variant="danger"
      />
    </div>
  );
}
