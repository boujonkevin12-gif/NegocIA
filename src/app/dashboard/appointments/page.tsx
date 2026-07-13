"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Plus, Calendar, Clock, X, ChevronLeft, ChevronRight, Pencil, Trash2, CalendarDays } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email?: string | null;
}

interface Appointment {
  id: string;
  clientId?: string | null;
  title: string;
  description?: string | null;
  date: string;
  duration: number;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  client?: Client | null;
}

type ViewMode = "day" | "week" | "month";
type FormStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const STATUS_LABELS: Record<FormStatus, string> = {
  SCHEDULED: "Programado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_BADGE: Record<FormStatus, "info" | "success" | "secondary" | "destructive"> = {
  SCHEDULED: "info",
  CONFIRMED: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

interface FormData {
  title: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  status: FormStatus;
  description: string;
}

const EMPTY_FORM: FormData = {
  title: "",
  clientId: "",
  date: "",
  time: "",
  duration: 60,
  status: "SCHEDULED",
  description: "",
};

function toLocalISOString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInput(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function getWeekStart(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function AppointmentsPage() {
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let from: string;
      let to: string;

      if (view === "day") {
        from = to = toLocalISOString(currentDate);
      } else if (view === "week") {
        const start = getWeekStart(currentDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        from = toLocalISOString(start);
        to = toLocalISOString(end);
      } else {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        to = `${y}-${String(m + 1).padStart(2, "0")}-${String(getDaysInMonth(y, m)).padStart(2, "0")}`;
      }

      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/appointments?${params}`);
      if (!res.ok) throw new Error("Error al cargar turnos");
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      toast({ title: "Error", description: "No se pudieron cargar los turnos", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [view, currentDate, toast]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) setClients(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function openNew(slotDate?: Date) {
    setEditingId(null);
    if (slotDate) {
      setForm({
        ...EMPTY_FORM,
        date: toLocalISOString(slotDate),
        time: toTimeInput(slotDate),
      });
    } else {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      setForm({
        ...EMPTY_FORM,
        date: toLocalISOString(new Date()),
        time: toTimeInput(now),
      });
    }
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(apt: Appointment) {
    const d = new Date(apt.date);
    setEditingId(apt.id);
    setForm({
      title: apt.title,
      clientId: apt.clientId || "",
      date: toLocalISOString(d),
      time: toTimeInput(d),
      duration: apt.duration,
      status: apt.status,
      description: apt.description || "",
    });
    setFormErrors({});
    setDetailAppointment(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!form.title.trim()) errors.title = "El título es requerido";
    if (!form.date) errors.date = "La fecha es requerida";
    if (!form.time) errors.time = "La hora es requerida";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);

    try {
      const [h, m] = form.time.split(":").map(Number);
      const dt = new Date(form.date);
      dt.setHours(h, m, 0, 0);

      const body = {
        title: form.title.trim(),
        clientId: form.clientId || null,
        date: dt.toISOString(),
        duration: form.duration,
        status: form.status,
        description: form.description.trim() || null,
      };

      const url = editingId ? `/api/appointments/${editingId}` : "/api/appointments";
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

      toast({
        title: editingId ? "Turno actualizado" : "Turno creado",
        variant: "success",
      });
      closeModal();
      fetchAppointments();
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
      const res = await fetch(`/api/appointments/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast({ title: "Turno eliminado", variant: "success" });
      setDeleteId(null);
      setDetailAppointment(null);
      fetchAppointments();
    } catch (err) {
      toast({ title: "Error", description: "No se pudo eliminar el turno", variant: "error" });
    }
  }

  async function handleCancel() {
    if (!cancellingId) return;
    try {
      const res = await fetch(`/api/appointments/${cancellingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error("Error al cancelar");
      toast({ title: "Turno cancelado", variant: "success" });
      setCancellingId(null);
      setDetailAppointment(null);
      fetchAppointments();
    } catch (err) {
      toast({ title: "Error", description: "No se pudo cancelar el turno", variant: "error" });
    }
  }

  function navigateDir(dir: number) {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  }

  function getApptsForDate(date: Date): Appointment[] {
    return appointments.filter((a) => isSameDay(new Date(a.date), date));
  }

  const rangeLabel = useMemo(() => {
    if (view === "day") {
      return currentDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    if (view === "week") {
      const start = getWeekStart(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
      return `${start.toLocaleDateString("es-AR", opts)} – ${end.toLocaleDateString("es-AR", opts)}`;
    }
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [view, currentDate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gestioná tus turnos y citas"
        action={{ label: "Nuevo Turno", onClick: () => openNew(), icon: <Plus className="h-4 w-4" /> }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-secondary p-1">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                view === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDir(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[180px] text-center text-sm font-medium text-foreground">{rangeLabel}</span>
          <Button variant="outline" size="icon" onClick={() => navigateDir(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          Hoy
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8 text-primary" />}
          title="Sin turnos"
          description="No hay turnos en este período. Creá uno para comenzar."
          action={{ label: "Nuevo Turno", onClick: () => openNew() }}
        />
      ) : view === "month" ? (
        <MonthView
          currentDate={currentDate}
          appointments={appointments}
          onDayClick={(d) => { setView("day"); setCurrentDate(d); }}
          onApptClick={setDetailAppointment}
        />
      ) : view === "week" ? (
        <WeekView
          currentDate={currentDate}
          appointments={appointments}
          onSlotClick={openNew}
          onApptClick={setDetailAppointment}
        />
      ) : (
        <DayView
          currentDate={currentDate}
          appointments={appointments}
          onSlotClick={openNew}
          onApptClick={setDetailAppointment}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? "Editar Turno" : "Nuevo Turno"}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Título *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Reunión con cliente"
                  className={formErrors.title ? "border-destructive" : ""}
                />
                {formErrors.title && <p className="text-xs text-destructive mt-1">{formErrors.title}</p>}
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Fecha *</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={formErrors.date ? "border-destructive" : ""}
                  />
                  {formErrors.date && <p className="text-xs text-destructive mt-1">{formErrors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Hora *</label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className={formErrors.time ? "border-destructive" : ""}
                  />
                  {formErrors.time && <p className="text-xs text-destructive mt-1">{formErrors.time}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Duración</label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as FormStatus })}
                    className="flex h-10 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {(Object.keys(STATUS_LABELS) as FormStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Turno"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailAppointment(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{detailAppointment.title}</h2>
              <button onClick={() => setDetailAppointment(null)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(detailAppointment.date).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(detailAppointment.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  {" "}· {detailAppointment.duration} min
                </span>
              </div>
              {detailAppointment.client && (
                <p className="text-muted-foreground">Cliente: <span className="text-foreground">{detailAppointment.client.name}</span></p>
              )}
              <Badge variant={STATUS_BADGE[detailAppointment.status]}>
                {STATUS_LABELS[detailAppointment.status]}
              </Badge>
              {detailAppointment.description && (
                <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{detailAppointment.description}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              {detailAppointment.status !== "CANCELLED" && (
                <Button variant="outline" size="sm" onClick={() => setCancellingId(detailAppointment.id)}>
                  Cancelar turno
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => openEdit(detailAppointment)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteId(detailAppointment.id)}>
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="¿Eliminar turno?"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />

      <ConfirmDialog
        open={!!cancellingId}
        onConfirm={handleCancel}
        onCancel={() => setCancellingId(null)}
        title="¿Cancelar turno?"
        description="El turno pasará a estado cancelado."
        confirmText="Cancelar turno"
        variant="warning"
      />
    </div>
  );
}

function DayView({
  currentDate,
  appointments,
  onSlotClick,
  onApptClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onSlotClick: (d: Date) => void;
  onApptClick: (a: Appointment) => void;
}) {
  const dayAppts = useMemo(
    () => appointments.filter((a) => isSameDay(new Date(a.date), currentDate)),
    [appointments, currentDate]
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative">
          {HOURS.map((hour) => {
            const slotAppts = dayAppts.filter((a) => {
              const d = new Date(a.date);
              return d.getHours() === hour;
            });
            return (
              <div key={hour} className="flex border-b border-border last:border-b-0">
                <div className="w-16 shrink-0 py-3 pr-3 text-right text-xs font-medium text-muted-foreground border-r border-border">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div
                  className="relative flex-1 min-h-[60px] cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => {
                    if (slotAppts.length === 0) {
                      const d = new Date(currentDate);
                      d.setHours(hour, 0, 0, 0);
                      onSlotClick(d);
                    }
                  }}
                >
                  {slotAppts.map((apt) => {
                    const startMin = new Date(apt.date).getMinutes();
                    const topPx = (startMin / 60) * 60;
                    const heightPx = Math.max((apt.duration / 60) * 60, 24);
                    return (
                      <div
                        key={apt.id}
                        onClick={(e) => { e.stopPropagation(); onApptClick(apt); }}
                        className={cn(
                          "absolute left-1 right-1 rounded-md px-2 py-1 text-xs font-medium cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 overflow-hidden",
                          apt.status === "SCHEDULED" && "bg-info/20 text-info border border-info/30",
                          apt.status === "CONFIRMED" && "bg-success/20 text-success border border-success/30",
                          apt.status === "COMPLETED" && "bg-secondary text-muted-foreground border border-border",
                          apt.status === "CANCELLED" && "bg-destructive/10 text-destructive/70 border border-destructive/20 line-through"
                        )}
                        style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      >
                        <span className="truncate block">{apt.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WeekView({
  currentDate,
  appointments,
  onSlotClick,
  onApptClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onSlotClick: (d: Date) => void;
  onApptClick: (a: Appointment) => void;
}) {
  const weekStart = getWeekStart(currentDate);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }),
    [weekStart.getTime()]
  );

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-8 border-b border-border">
            <div className="border-r border-border p-2" />
            {days.map((d, i) => {
              const isToday = isSameDay(d, new Date());
              return (
                <div key={i} className={cn("border-r border-border last:border-r-0 p-2 text-center", isToday && "bg-primary/5")}>
                  <p className="text-xs font-medium text-muted-foreground">{DAY_NAMES[i]}</p>
                  <p className={cn("text-sm font-bold", isToday ? "text-primary" : "text-foreground")}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-8">
            <div className="border-r border-border">
              {HOURS.map((h) => (
                <div key={h} className="h-14 border-b border-border flex items-start justify-end pr-2 pt-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground">{String(h).padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>
            {days.map((d, di) => {
              const dayAppts = appointments.filter((a) => isSameDay(new Date(a.date), d));
              const isToday = isSameDay(d, new Date());
              return (
                <div key={di} className={cn("border-r border-border last:border-r-0 relative", isToday && "bg-primary/5")}>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="h-14 border-b border-border cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() => { const nd = new Date(d); nd.setHours(h, 0, 0, 0); onSlotClick(nd); }}
                    />
                  ))}
                  {dayAppts.map((apt) => {
                    const d2 = new Date(apt.date);
                    const hourOffset = d2.getHours() - 8;
                    if (hourOffset < 0) return null;
                    const minOffset = (d2.getMinutes() / 60) * 56;
                    const heightPx = Math.max((apt.duration / 60) * 56, 18);
                    return (
                      <div
                        key={apt.id}
                        onClick={(e) => { e.stopPropagation(); onApptClick(apt); }}
                        className={cn(
                          "absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] font-medium cursor-pointer hover:ring-1 hover:ring-primary/50 overflow-hidden z-10",
                          apt.status === "SCHEDULED" && "bg-info/20 text-info",
                          apt.status === "CONFIRMED" && "bg-success/20 text-success",
                          apt.status === "COMPLETED" && "bg-secondary text-muted-foreground",
                          apt.status === "CANCELLED" && "bg-destructive/10 text-destructive/70 line-through"
                        )}
                        style={{ top: `${hourOffset * 56 + minOffset}px`, height: `${heightPx}px` }}
                      >
                        <span className="truncate block">{apt.title}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthView({
  currentDate,
  appointments,
  onDayClick,
  onApptClick,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onDayClick: (d: Date) => void;
  onApptClick: (a: Appointment) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [firstDay, daysInMonth]);

  const apptMap = useMemo(() => {
    const map: Record<number, Appointment[]> = {};
    for (const apt of appointments) {
      const d = new Date(apt.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(apt);
      }
    }
    return map;
  }, [appointments, year, month]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {DAY_NAMES.map((n) => (
            <div key={n} className="bg-secondary/50 p-2 text-center text-xs font-semibold text-muted-foreground">
              {n}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} className="bg-card min-h-[80px]" />;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const dayAppts = apptMap[day] || [];
            const clickedDate = new Date(year, month, day);
            return (
              <div
                key={day}
                className={cn(
                  "bg-card min-h-[80px] p-1.5 cursor-pointer hover:bg-secondary/30 transition-colors",
                  isToday && "ring-2 ring-inset ring-primary/40"
                )}
                onClick={() => onDayClick(clickedDate)}
              >
                <p className={cn("text-xs font-medium mb-1", isToday ? "text-primary font-bold" : "text-muted-foreground")}>
                  {day}
                </p>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => { e.stopPropagation(); onApptClick(apt); }}
                      className={cn(
                        "rounded px-1 py-0.5 text-[10px] font-medium truncate cursor-pointer",
                        apt.status === "SCHEDULED" && "bg-info/15 text-info",
                        apt.status === "CONFIRMED" && "bg-success/15 text-success",
                        apt.status === "COMPLETED" && "bg-secondary text-muted-foreground",
                        apt.status === "CANCELLED" && "bg-destructive/10 text-destructive/70 line-through"
                      )}
                    >
                      {apt.title}
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <p className="text-[9px] text-muted-foreground pl-1">+{dayAppts.length - 3} más</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
