"use client";

import { useRouter } from "next/navigation";

interface AICenterProps {
  monthlyExpenses: number;
  investmentChange: number;
  investmentValue: number;
  balance: number;
}

const formatARS = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function AICenter({
  monthlyExpenses,
  investmentChange,
  investmentValue,
  balance,
}: AICenterProps) {
  const router = useRouter();

  const advisors = [
    {
      id: "finance",
      icon: "💰",
      label: "Finanzas",
      metric: monthlyExpenses > 0 ? "Último análisis" : "Sin datos",
      value: monthlyExpenses > 0 ? `Gastaste ${formatARS(monthlyExpenses)}` : "Conectá tu banco",
      color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
      hoverColor: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
      message: "Quiero analizar mis finanzas personales",
    },
    {
      id: "investments",
      icon: "📈",
      label: "Inversiones",
      metric: investmentValue > 0 ? "Rentabilidad" : "Sin inversiones",
      value: investmentValue > 0
        ? `${investmentChange >= 0 ? "+" : ""}${investmentChange.toFixed(1)}% este mes`
        : "Sumá tu primer activo",
      color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
      hoverColor: "hover:border-blue-500/40 hover:shadow-blue-500/10",
      message: "Analizá mi portfolio de inversiones",
    },
    {
      id: "marketing",
      icon: "📣",
      label: "Marketing",
      metric: "Estrategia",
      value: "Creá tu plan de marketing",
      color: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
      hoverColor: "hover:border-purple-500/40 hover:shadow-purple-500/10",
      message: "Necesito ayuda con la estrategia de marketing de mi negocio",
    },
    {
      id: "business",
      icon: "🏪",
      label: "Negocios",
      metric: "Análisis",
      value: balance > 0 ? `Balance: ${formatARS(balance)}` : "Conectá tu negocio",
      color: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
      hoverColor: "hover:border-amber-500/40 hover:shadow-amber-500/10",
      message: "Quiero analizar la situación de mi negocio",
    },
    {
      id: "legal",
      icon: "⚖️",
      label: "Legal",
      metric: "Orientación",
      value: "Consultas legales",
      color: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
      hoverColor: "hover:border-rose-500/40 hover:shadow-rose-500/10",
      message: "Tengo una consulta sobre temas legales de mi negocio",
    },
    {
      id: "accounting",
      icon: "📋",
      label: "Contabilidad",
      metric: "Impuestos",
      value: "Calculá tus deducciones",
      color: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
      hoverColor: "hover:border-cyan-500/40 hover:shadow-cyan-500/10",
      message: "Ayudame con la contabilidad y los impuestos de mi empresa",
    },
  ];

  return (
    <div className="space-y-5 animate-slide-up stagger-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Centro de IA</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {advisors.map((advisor) => (
          <button
            key={advisor.id}
            onClick={() =>
              router.push(
                `/dashboard/chat?q=${encodeURIComponent(advisor.message)}`
              )
            }
            className={`group relative flex flex-col items-start gap-3 rounded-2xl border bg-gradient-to-b p-5 text-left transition-all duration-300 hover:shadow-lg ${advisor.color} ${advisor.hoverColor} active:scale-[0.97]`}
          >
            <span className="text-2xl">{advisor.icon}</span>
            <div className="w-full">
              <p className="text-sm font-semibold">{advisor.label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">{advisor.metric}</p>
              <p className="mt-0.5 text-xs font-medium text-foreground/80 truncate">{advisor.value}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
