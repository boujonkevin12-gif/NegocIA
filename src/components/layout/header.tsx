"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Bell,
  PanelLeftClose,
  PanelLeft,
  Command,
} from "lucide-react";

interface HeaderProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/chat": "Asistente IA",
  "/dashboard/finances": "Finanzas",
  "/dashboard/investments": "Inversiones",
  "/dashboard/settings": "Configuración",
};

export function Header({ collapsed, onToggle }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);

  const title = pageTitles[pathname] || "NegocIA";

  const userName = session?.user?.name || "Usuario";

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-6">
      <Button variant="ghost" size="icon" onClick={onToggle} className="shrink-0">
        {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </Button>

      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex-1" />

      <div className={cn("relative transition-all duration-200", searchFocused ? "w-80" : "w-64")}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          className="h-9 pl-9 pr-12 bg-secondary/50 border-transparent"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5">
          <Command className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">K</span>
        </div>
      </div>

      <Button variant="ghost" size="icon" className="relative shrink-0">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
      </Button>

      <Avatar name={userName} size="sm" />
    </header>
  );
}
