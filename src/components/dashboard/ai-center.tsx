"use client";

import { useRouter } from "next/navigation";

const advisors = [
  {
    id: "finance",
    icon: "💰",
    label: "Finanzas",
    description: "Análisis de gastos, presupuesto y ahorro",
    color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    hoverColor: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
    message: "Quiero analizar mis finanzas personales",
  },
  {
    id: "investments",
    icon: "📈",
    label: "Inversiones",
    description: "Acciones, CEDEARs, cripto y fondos",
    color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    hoverColor: "hover:border-blue-500/40 hover:shadow-blue-500/10",
    message: "Analizá mi portfolio de inversiones",
  },
  {
    id: "marketing",
    icon: "📣",
    label: "Marketing",
    description: "Estrategia, redes y crecimiento",
    color: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
    hoverColor: "hover:border-purple-500/40 hover:shadow-purple-500/10",
    message: "Necesito ayuda con la estrategia de marketing de mi negocio",
  },
  {
    id: "business",
    icon: "🏪",
    label: "Negocios",
    description: "Análisis de tu comercio o empresa",
    color: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    hoverColor: "hover:border-amber-500/40 hover:shadow-amber-500/10",
    message: "Quiero analizar la situación de mi negocio",
  },
  {
    id: "legal",
    icon: "⚖️",
    label: "Legal",
    description: "Contratos, regulaciones y compliance",
    color: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
    hoverColor: "hover:border-rose-500/40 hover:shadow-rose-500/10",
    message: "Tengo una consulta sobre temas legales de mi negocio",
  },
  {
    id: "accounting",
    icon: "📋",
    label: "Contabilidad",
    description: "Facturación, impuestos y balances",
    color: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
    hoverColor: "hover:border-cyan-500/40 hover:shadow-cyan-500/10",
    message: "Ayudame con la contabilidad y los impuestos de mi empresa",
  },
];

export function AICenter() {
  const router = useRouter();

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
            className={`group relative flex flex-col items-center gap-3 rounded-2xl border bg-gradient-to-b p-5 text-center transition-all duration-300 hover:shadow-lg ${advisor.color} ${advisor.hoverColor} active:scale-[0.97]`}
          >
            <span className="text-3xl">{advisor.icon}</span>
            <div>
              <p className="text-sm font-semibold">{advisor.label}</p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                {advisor.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
