"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { Discoveries } from "@/components/dashboard/discoveries";
import { Goals } from "@/components/dashboard/goals";
import { Subscriptions } from "@/components/dashboard/subscriptions";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { AnalyzeButton } from "@/components/dashboard/analyze-button";
import { SkeletonStats } from "@/components/dashboard/skeleton-stats";
import {
  MessageSquare,
  TrendingUp,
  Megaphone,
  Rocket,
  Scale,
  Calculator,
} from "lucide-react";

const advisors = [
  { label: "¿Cómo puedo mejorar mis finanzas?", icon: Calculator, color: "text-emerald-400", q: "¿Cómo puedo mejorar mis finanzas?" },
  { label: "Analiza mis inversiones", icon: TrendingUp, color: "text-blue-400", q: "Analiza mis inversiones" },
  { label: "Dame ideas de marketing", icon: Megaphone, color: "text-pink-400", q: "Dame ideas de marketing" },
  { label: "Cómo hacer crecer mi negocio", icon: Rocket, color: "text-orange-400", q: "Cómo hacer crecer mi negocio" },
  { label: "Revisá mi situación legal", icon: Scale, color: "text-violet-400", q: "Revisá mi situación legal" },
  { label: "Ayudame con la contabilidad", icon: MessageSquare, color: "text-cyan-400", q: "Ayudame con la contabilidad" },
];

type InsightType = "opportunity" | "warning" | "info" | "success" | "tip";
type DiscoveryType = "warning" | "tip" | "success" | "info";

interface DashboardStats {
  balance: number;
  previousBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  clientCount: number;
  insights: { id: string; icon: string; text: string; type: InsightType }[];
  discoveries: { id: string; icon: string; text: string; type: DiscoveryType }[];
  goals: { id: string; name: string; icon: string; target: number; current: number; currency: string }[];
  subscriptions: { id: string; name: string; icon: string; amount: number; frequency: string; lastUsedAt: string | null; active: boolean }[];
  investmentChange: number;
  investmentValue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    balance: 0,
    previousBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    clientCount: 0,
    insights: [],
    discoveries: [],
    goals: [],
    subscriptions: [],
    investmentChange: 0,
    investmentValue: 0,
  });

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats({
          balance: data.balance ?? 0,
          previousBalance: 0,
          monthlyIncome: data.totalIncome ?? 0,
          monthlyExpenses: data.totalExpenses ?? 0,
          clientCount: data.clientCount ?? 0,
          insights: data.insights ?? [],
          discoveries: data.discoveries ?? [],
          goals: data.goals ?? [],
          subscriptions: data.subscriptions ?? [],
          investmentChange: data.investmentChange ?? 0,
          investmentValue: data.investmentValue ?? 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex gap-8 pb-12">
      <div className="flex-1 space-y-10 min-w-0">
        {loading ? (
          <SkeletonStats />
        ) : (
          <>
            <DashboardHero
              insights={stats.insights}
              balance={stats.balance}
              previousBalance={stats.previousBalance}
              monthlyIncome={stats.monthlyIncome}
              monthlyExpenses={stats.monthlyExpenses}
            />

            <AnalyzeButton />

            <section className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="mb-4 text-lg font-semibold">Centro IA</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {advisors.map((a) => (
                  <button
                    key={a.q}
                    onClick={() => router.push(`/dashboard/chat?q=${encodeURIComponent(a.q)}`)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-4 text-left transition-all hover:bg-secondary hover:scale-[1.02]"
                  >
                    <a.icon className={`h-5 w-5 shrink-0 ${a.color}`} />
                    <span className="text-sm font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <Discoveries discoveries={stats.discoveries} />

            <div className="grid gap-8 lg:grid-cols-2">
              <Goals goals={stats.goals} />
              <Subscriptions subscriptions={stats.subscriptions} />
            </div>
          </>
        )}
      </div>

      <aside className="hidden xl:block w-72 shrink-0">
        <div className="sticky top-[calc(var(--header-height)+24px)]">
          <ActivityPanel />
        </div>
      </aside>
    </div>
  );
}
