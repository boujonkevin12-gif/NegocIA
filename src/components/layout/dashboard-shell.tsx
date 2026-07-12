"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div
        className="transition-all duration-300"
        style={{ marginLeft: collapsed ? "68px" : "var(--sidebar-width)" }}
      >
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <div className="flex">
          <main className="flex-1 p-6 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
