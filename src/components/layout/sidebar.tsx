"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  DollarSign,
  Package,
  Calendar,
  Wallet,
  TrendingUp,
  Landmark,
  BarChart3,
  Target,
  CreditCard,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Asistente IA", href: "/dashboard/chat", icon: MessageSquare, badge: "IA" },
];

const sections = [
  {
    title: "Gestión",
    items: [
      { label: "Clientes", href: "/dashboard/clients", icon: Users },
      { label: "Ventas", href: "/dashboard/sales", icon: DollarSign },
      { label: "Productos", href: "/dashboard/products", icon: Package },
      { label: "Agenda", href: "/dashboard/appointments", icon: Calendar },
    ] as NavItem[],
  },
  {
    title: "Finanzas",
    items: [
      { label: "Finanzas", href: "/dashboard/finances", icon: Wallet },
      { label: "Inversiones", href: "/dashboard/investments", icon: TrendingUp },
      { label: "Bancos y Billeteras", href: "/dashboard/banks", icon: Landmark },
    ] as NavItem[],
  },
  {
    title: "Análisis",
    items: [
      { label: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
      { label: "Objetivos", href: "/dashboard", icon: Target },
      { label: "Suscripciones", href: "/dashboard", icon: CreditCard },
    ] as NavItem[],
  },
  {
    title: "Sistema",
    items: [
      { label: "Configuración", href: "/dashboard/settings", icon: Settings },
    ] as NavItem[],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const userName = session?.user?.name || "Usuario";
  const userEmail = session?.user?.email || "";

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[var(--sidebar-width)]"
      )}
    >
      <div className="flex h-[var(--header-height)] items-center px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">NegocIA</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </Link>
        )}
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div className="space-y-0.5">
          {mainItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Separator />

      <div className="space-y-1 px-3 py-4">
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <Avatar name={userName} size="sm" />
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{userName}</span>
              <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        {collapsed && (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
