"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  MessageSquare,
  Wallet,
  TrendingUp,
  Settings,
  X,
  Sparkles,
} from "lucide-react";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Asistente IA", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Finanzas", href: "/dashboard/finances", icon: Wallet },
  { label: "Inversiones", href: "/dashboard/investments", icon: TrendingUp },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-card border-r border-border transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[var(--header-height)] items-center justify-between px-4">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">NegocIA</span>
          </Link>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
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
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <Separator />

        <div className="flex items-center gap-3 px-6 py-4">
          <Avatar name="Agustín" size="sm" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">Agustín</span>
            <span className="text-xs text-muted-foreground truncate">agustin@negocia.com</span>
          </div>
        </div>
      </div>
    </>
  );
}
