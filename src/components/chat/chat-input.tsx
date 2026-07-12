"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
}

export function ChatInput({ value, onChange, onSend, loading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border bg-background px-4 pt-3 pb-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-secondary/30 p-2 focus-within:border-primary/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu mensaje..."
            rows={1}
            className="min-h-[40px] max-h-[200px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button
            size="icon"
            className="shrink-0 rounded-xl h-10 w-10"
            onClick={onSend}
            disabled={!value.trim() || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          NegocIA puede cometer errores. Verificá la información importante.
        </p>
      </div>
    </div>
  );
}
