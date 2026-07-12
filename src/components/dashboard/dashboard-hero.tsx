"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";

interface Insight {
  id: string;
  icon: string;
  text: string;
  type: "opportunity" | "warning" | "info" | "success";
}

const suggestions = [
  { icon: "📊", label: "Analizar mis gastos", message: "Analizá mis gastos del último mes" },
  { icon: "🚗", label: "¿Puedo comprar un auto?", message: "Con mi situación financiera actual, ¿puedo comprarme un auto?" },
  { icon: "📈", label: "Ayudame a invertir", message: "Quiero empezar a invertir. ¿Dónde pongo mi dinero?" },
  { icon: "🏢", label: "Quiero abrir un negocio", message: "Quiero abrir un negocio. ¿Me ayudás a analizar la viabilidad?" },
  { icon: "📋", label: "¿Cómo reduzco impuestos?", message: "¿Cómo puedo reducir legalmente mis impuestos?" },
  { icon: "💼", label: "Analizá mi empresa", message: "Analizá la situación financiera de mi empresa" },
];

const typeStyles: Record<string, string> = {
  opportunity: "border-l-emerald-500 bg-emerald-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  info: "border-l-blue-500 bg-blue-500/5",
  success: "border-l-emerald-500 bg-emerald-500/5",
};

export function DashboardHero({ insights }: { insights: Insight[] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const name = session?.user?.name?.split(" ")[0] || "Usuario";

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Buenas noches";
  if (hour >= 5 && hour < 12) greeting = "Buenos días";
  else if (hour >= 12 && hour < 19) greeting = "Buenas tardes";

  const handleSuggestion = (message: string) => {
    router.push(`/dashboard/chat?q=${encodeURIComponent(message)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height)-96px)] px-4">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            NegocIA
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {name} 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            ¿Qué querés hacer hoy?
          </p>
        </div>

        {insights.length > 0 && (
          <div className="space-y-2.5">
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSuggestion(s.message)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 active:scale-[0.98]"
            >
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
