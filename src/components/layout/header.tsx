"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, PanelLeftClose, PanelLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const suggestions = [
  "¿Cómo puedo ahorrar?",
  "¿Conviene comprar dólares?",
  "¿Me alcanza para un auto?",
  "¿Cómo aumentar ventas?",
  "Analizá mis inversiones",
];

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Header({ collapsed, onToggle }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/chat?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  const handleSuggestion = (s: string) => {
    router.push(`/dashboard/chat?q=${encodeURIComponent(s)}`);
    setQuery("");
    setFocused(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4">
      <button
        onClick={onToggle}
        className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      <div className="relative flex-1 max-w-xl">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Preguntale cualquier cosa..."
            className={cn(
              "w-full rounded-xl border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
              focused ? "border-primary/50 bg-secondary" : "border-border"
            )}
          />
        </form>

        {focused && !query && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card p-2 shadow-xl shadow-black/20">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Sugerencias
            </p>
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => handleSuggestion(s)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-left"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
      </button>
    </header>
  );
}
