"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";

interface Insight {
  id: string;
  icon: string;
  text: string;
  type: "opportunity" | "warning" | "info" | "success";
}

const typeStyles: Record<string, string> = {
  opportunity: "border-l-emerald-500 bg-emerald-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  info: "border-l-blue-500 bg-blue-500/5",
  success: "border-l-emerald-500 bg-emerald-500/5",
};

export function DashboardHero({ insights }: { insights: Insight[] }) {
  const { data: session } = useSession();
  const name = session?.user?.name?.split(" ")[0] || "Usuario";

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Buenas noches";
  if (hour >= 5 && hour < 12) greeting = "Buenos días";
  else if (hour >= 12 && hour < 19) greeting = "Buenas tardes";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {name} 👋
        </h1>
        {insights.length > 0 && (
          <p className="mt-2 text-muted-foreground">
            Hoy encontré{" "}
            <span className="font-semibold text-foreground">{insights.length} oportunidades</span>{" "}
            para vos.
          </p>
        )}
      </div>

      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`flex items-start gap-3 rounded-xl border border-l-4 p-4 ${typeStyles[insight.type]}`}
            >
              <span className="mt-0.5 text-lg">{insight.icon}</span>
              <p className="text-sm leading-relaxed text-foreground/90">{insight.text}</p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/chat"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
      >
        <MessageSquare className="h-4 w-4" />
        Hablar con NegocIA
      </Link>
    </div>
  );
}
