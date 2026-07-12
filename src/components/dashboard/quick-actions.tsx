"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  PiggyBank,
  Calculator,
  FileText,
} from "lucide-react";

const actions = [
  {
    label: "Hablá con NegocIA",
    description: "Consultá cualquier cosa",
    href: "/dashboard/chat",
    icon: MessageSquare,
    color: "bg-primary/10 text-primary",
    featured: true,
  },
  {
    label: "Registrar gasto",
    description: "Cargá un nuevo gasto",
    href: "/dashboard/finances",
    icon: ArrowUpRight,
    color: "bg-destructive/10 text-destructive",
  },
  {
    label: "Registrar ingreso",
    description: "Anotá un ingreso nuevo",
    href: "/dashboard/finances",
    icon: ArrowDownRight,
    color: "bg-success/10 text-success",
  },
  {
    label: "Nueva inversión",
    description: "Agregá una inversión",
    href: "/dashboard/investments",
    icon: TrendingUp,
    color: "bg-warning/10 text-warning",
  },
  {
    label: "Calcular impuestos",
    description: "Estimá tus impuestos",
    href: "/dashboard/chat",
    icon: Calculator,
    color: "bg-info/10 text-info",
  },
  {
    label: "Exportar datos",
    description: "Descargá tu info",
    href: "/dashboard/finances",
    icon: FileText,
    color: "bg-secondary text-muted-foreground",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <Card className="h-full hover:border-primary/30 transition-all cursor-pointer group">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color} transition-transform group-hover:scale-110`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium leading-tight">{action.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
