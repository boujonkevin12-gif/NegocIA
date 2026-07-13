"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Bell, ChevronDown, Sparkles } from "lucide-react";
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
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const userName = session?.user?.name || "Usuario";
  const userInitial = userName.charAt(0).toUpperCase();

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
    <header
      className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-4 px-6"
      style={{
        background: "rgba(11, 16, 32, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Preguntale cualquier cosa..."
            className={cn(
              "w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none",
              focused
                ? "bg-white/10 ring-1 ring-primary/30"
                : "bg-white/5 hover:bg-white/8"
            )}
            style={{ border: "1px solid var(--border)" }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 items-center rounded-md bg-white/5 px-1.5 text-[10px] font-medium text-muted-foreground" style={{ border: "1px solid var(--border)" }}>
              ⌘K
            </kbd>
          </div>
        </form>

        {focused && !query && (
          <div
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl p-2"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Sugerencias
            </p>
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => handleSuggestion(s)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors text-left"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/40" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-white/10" />

        {/* User */}
        <button className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-white/5 transition-all duration-200">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)" }}
          >
            {userInitial}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-white">{userName}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
