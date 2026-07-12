"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatEmpty } from "@/components/chat/chat-empty";
import { ChatInput } from "@/components/chat/chat-input";
import { PanelLeftClose, PanelLeft, MessageSquarePlus } from "lucide-react";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get("q");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialSent, setInitialSent] = useState(false);

  useEffect(() => {
    if (initialMessage && !initialSent && !loading) {
      setInitialSent(true);
      handleSend(initialMessage);
    }
  }, [initialMessage, initialSent]);

  const loadConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text || input).trim();
      if (!content || loading) return;

      setInput("");
      setLoading(true);

      let convId = activeConversationId;

      if (!convId) {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.slice(0, 60) }),
        });
        const conv = await res.json();
        convId = conv.id;
        setActiveConversationId(convId);
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "USER",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId, content }),
        });

        const data = await res.json();

        if (res.ok) {
          const aiMsg: Message = {
            id: crypto.randomUUID(),
            role: "ASSISTANT",
            content: data.content,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      } catch {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: "Hubo un error al procesar tu mensaje. Intentá de nuevo.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setRefreshKey((k) => k + 1);
      }
    },
    [input, loading, activeConversationId]
  );

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-48px)]">
      {/* Conversation sidebar */}
      <div
        className={cn(
          "shrink-0 border-r border-border bg-background transition-all duration-300 overflow-hidden",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        <ConversationSidebar
          activeId={activeConversationId ?? undefined}
          onSelect={loadConversation}
          onNew={handleNewConversation}
          refreshKey={refreshKey}
        />
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">NegocIA</span>
            {activeConversationId && (
              <span className="text-muted-foreground">·</span>
            )}
          </div>
          {activeConversationId && (
            <button
              onClick={handleNewConversation}
              className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Nueva
            </button>
          )}
        </div>

        {/* Messages or empty state */}
        {messages.length === 0 && !loading ? (
          <ChatEmpty onSend={handleSend} loading={loading} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ChatMessages messages={messages} isLoading={false} />
          </div>
        )}

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          loading={loading}
        />
      </div>
    </div>
  );
}
