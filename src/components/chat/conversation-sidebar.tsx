"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ConversationSidebarProps {
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  refreshKey?: number;
}

export function ConversationSidebar({ activeId, onSelect, onNew, refreshKey }: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) onNew();
    setDeletingId(null);
  };

  const groupByDate = (convs: Conversation[]) => {
    const now = new Date();
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const thisWeek: Conversation[] = [];
    const older: Conversation[] = [];

    convs.forEach((c) => {
      const d = new Date(c.updatedAt);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diffDays < 1) today.push(c);
      else if (diffDays < 2) yesterday.push(c);
      else if (diffDays < 7) thisWeek.push(c);
      else older.push(c);
    });

    return [
      { label: "Hoy", items: today },
      { label: "Ayer", items: yesterday },
      { label: "Esta semana", items: thisWeek },
      { label: "Anteriores", items: older },
    ].filter((g) => g.items.length > 0);
  };

  const groups = groupByDate(conversations);

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          onClick={onNew}
          variant="outline"
          className="w-full justify-start gap-2 text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">Sin conversaciones aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onSelect(conv.id)}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                        activeId === conv.id
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{conv.title}</span>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        {deletingId === conv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>NegocIA v0.1</span>
        </div>
      </div>
    </div>
  );
}
