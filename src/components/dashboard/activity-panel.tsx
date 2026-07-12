"use client";

import { CheckCircle2, TrendingUp, Sparkles, FileText, Bot } from "lucide-react";

interface Activity {
  id: string;
  icon: React.ReactNode;
  text: string;
  time: string;
  color: string;
}

const defaultActivities: Activity[] = [
  {
    id: "1",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    text: "Banco conectado",
    time: "Hace 2 min",
    color: "text-emerald-500",
  },
  {
    id: "2",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    text: "Análisis terminado",
    time: "Hace 5 min",
    color: "text-primary",
  },
  {
    id: "3",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    text: "Nueva recomendación",
    time: "Hace 12 min",
    color: "text-blue-500",
  },
  {
    id: "4",
    icon: <FileText className="h-3.5 w-3.5" />,
    text: "Reporte generado",
    time: "Hace 1 hora",
    color: "text-amber-500",
  },
  {
    id: "5",
    icon: <Bot className="h-3.5 w-3.5" />,
    text: "IA respondió",
    time: "Hace 2 horas",
    color: "text-primary",
  },
];

export function ActivityPanel() {
  return (
    <div className="space-y-4 animate-slide-up stagger-7">
      <h3 className="text-sm font-semibold tracking-tight text-foreground/80">
        Actividad reciente
      </h3>

      <div className="space-y-1">
        {defaultActivities.map((activity, i) => (
          <div
            key={activity.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary/50 animate-check-in stagger-${i + 1}`}
          >
            <span className={activity.color}>{activity.icon}</span>
            <span className="flex-1 text-foreground/80">{activity.text}</span>
            <span className="text-[11px] text-muted-foreground/60">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
