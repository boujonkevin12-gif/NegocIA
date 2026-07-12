"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="space-y-0">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "group px-4 py-6",
            msg.role === "ASSISTANT" ? "bg-card" : ""
          )}
        >
          <div className="mx-auto max-w-3xl flex gap-4">
            <div className="shrink-0 pt-0.5">
              {msg.role === "ASSISTANT" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <Avatar name="Tú" size="sm" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold">
                {msg.role === "ASSISTANT" ? "NegocIA" : "Tú"}
              </p>
              <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {msg.content}
              </div>
              {msg.role === "ASSISTANT" && (
                <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={msg.content} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="bg-card px-4 py-6">
          <div className="mx-auto max-w-3xl flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="pt-1">
              <p className="text-sm font-semibold mb-2">NegocIA</p>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
