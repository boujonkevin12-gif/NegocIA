"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: PageHeaderAction;
  className?: string;
}

function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("animate-fade-in", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            {action.icon}
            {action.label}
          </button>
        )}
      </div>
      <div className="mt-4 h-[1px] w-full bg-border" />
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps, PageHeaderAction };
