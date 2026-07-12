"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  MessageSquare,
  Wallet,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Asistente IA", href: "/dashboard/chat", icon: MessageSquare, badge: "IA" },
  { label: "Finanzas", href: "/dashboard/finances", icon: Wallet },
  { label: "Inversiones", href: "/dashboard/investments", icon: TrendingUp },
];

const bottomItems: NavItem[] = [
  { label: "Configuración", href: "/dashboard/settings", icon: Settings },
  { label: "Ayuda", href: "/dashboard/help", icon: HelpCircle },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const userName = session?.user?.name || "Usuario";
  const userEmail = session?.user?.email || "";

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[var(--sidebar-width)]"
      )}
    >
      <div className="flex h-[var(--header-height)] items-center justify-between px-4">
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

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
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
      </nav>

      <Separator />

      <div className="space-y-1 px-3 py-4">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <Separator className="my-2" />

        <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5", collapsed && "justify-center px-0")}>
          <Avatar name={userName} size="sm" />
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{userName}</span>
              <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
