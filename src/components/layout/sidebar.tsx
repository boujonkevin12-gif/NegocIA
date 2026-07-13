"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  DollarSign,
  CreditCard,
  Calendar,
  Wallet,
  TrendingUp,
  Landmark,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Package,
  Megaphone,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "IA", href: "/dashboard/chat", icon: MessageSquare },
];

const sections = [
  {
    title: "GESTIÓN",
    items: [
      { label: "Clientes", href: "/dashboard/clients", icon: Users },
      { label: "Agenda", href: "/dashboard/appointments", icon: Calendar },
      { label: "Ventas", href: "/dashboard/sales", icon: DollarSign },
      { label: "Cobros", href: "/dashboard/billing", icon: CreditCard },
    ] as NavItem[],
  },
  {
    title: "FINANZAS",
    items: [
      { label: "Bancos y Billeteras", href: "/dashboard/banks", icon: Landmark },
      { label: "Finanzas", href: "/dashboard/finances", icon: Wallet },
      { label: "Inversiones", href: "/dashboard/investments", icon: TrendingUp },
    ] as NavItem[],
  },
  {
    title: "NEGOCIO",
    items: [
      { label: "Stock", href: "/dashboard/products", icon: Package },
      { label: "Marketing", href: "/dashboard/chat", icon: Megaphone },
      { label: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
    ] as NavItem[],
  },
  {
    title: "SISTEMA",
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
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[var(--sidebar-width)]"
      )}
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div className="flex h-[var(--header-height)] items-center px-5">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30 transition-transform duration-200 group-hover:scale-110">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-white">
                NegocIA
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                Asistente financiero
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </Link>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          {mainItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("sidebar-item", isActive && "active")}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="section-label">{section.title}</p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={cn("sidebar-item", isActive && "active")}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        className="mx-3 mb-3 rounded-xl p-3 transition-colors"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {userInitial}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{userName}</span>
              <span className="text-xs text-muted-foreground truncate">
                {session?.user?.email || ""}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        {collapsed && (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
