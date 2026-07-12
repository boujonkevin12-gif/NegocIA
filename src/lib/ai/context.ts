import { prisma } from "@/lib/prisma";
import type { AIMessage } from "./types";

export type AdvisorType = "finance" | "investments" | "marketing" | "business" | "legal" | "accounting";

const advisorPersonalities: Record<AdvisorType, string> = {
  finance: `Sos el asesor de FINANZAS PERSONALES de NegocIA. Tu especialidad es ayudar a las personas a:
- Analizar sus gastos e identificar dónde pueden ahorrar
- Crear presupuestos personalizados
- Planificar metas de ahorro
- Entender su flujo de caja
Sé directo, práctico y usá números concretos. Cuando des un consejo, calculá el impacto en pesos argentinos.`,

  investments: `Sos el asesor de INVERSIONES de NegocIA. Tu especialidad es:
- Analizar portfolios de acciones, bonos, CEDEARs, cripto y fondos
- Evaluar riesgo y diversificación
- Explicar instrumentos financieros
- Recomendar estrategias según el perfil del usuario
Sé analítico, mostrá porcentajes de variación, y siempre aclará que las inversiones tienen riesgo.`,

  marketing: `Sos el asesor de MARKETING de NegocIA. Tu especialidad es:
- Estrategias de marketing digital para negocios
- Análisis de redes sociales y campañas
- Posicionamiento y marca personal
- Growth hacking y adquisición de clientes
Sé creativo, proponé acciones concretas y medibles, y explicá el ROI esperado.`,

  business: `Sos el asesor de NEGOCIOS de NegocIA. Tu especialidad es:
- Análisis de viabilidad de negocios
- P&L, márgenes y Unit Economics
- Gestión de stock y proveedores
- Benchmarking y competencia
Hablá como un socio comercial inteligente. Analizá números, detectá oportunidades y riesgos.`,

  legal: `Sos el asesor LEGAL de NegocIA. Tu especialidad es:
- Tipos societarios (SAS, SRL, SA)
- Regulaciones impositivas argentinas
- Contratos y regulaciones laborales
- Compliance y normativas
Sé preciso pero accesible. Siempre aclará que no reemplazás un abogado real, pero podés orientar.`,

  accounting: `Sos el asesor de CONTABILIDAD de NegocIA. Tu especialidad es:
- Facturación A y B, IVA, ganancias
- Conciliación bancaria
- Balances y estados contables
- Planning fiscal y deducciones
Sé metódico, usá terminología contable correcta, y ayudá a entender las obligaciones fiscales.`,
};

export async function buildFinancialContext(
  userId: string,
  history: { role: string; content: string }[],
  advisor?: AdvisorType,
): Promise<AIMessage[]> {
  const [transactions, investments, goals, subscriptions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50,
      select: {
        type: true,
        category: true,
        amount: true,
        currency: true,
        description: true,
        date: true,
      },
    }),
    prisma.investment.findMany({
      where: { userId, status: "ACTIVE" },
      select: {
        name: true,
        type: true,
        symbol: true,
        amount: true,
        quantity: true,
        buyPrice: true,
        currentPrice: true,
        currency: true,
      },
    }),
    prisma.goal.findMany({
      where: { userId },
      select: { name: true, icon: true, target: true, current: true },
    }),
    prisma.subscription.findMany({
      where: { userId, active: true },
      select: { name: true, amount: true, frequency: true, lastUsedAt: true },
    }),
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const investmentValue = investments.reduce(
    (sum, i) => sum + Number(i.currentPrice ?? i.amount),
    0
  );

  const investmentCost = investments.reduce(
    (sum, i) => sum + Number(i.buyPrice) * Number(i.quantity ?? 1),
    0
  );

  const categoryBreakdown = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
      return acc;
    }, {});

  const topExpenses = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, total]) => `  - ${category}: $${total.toLocaleString("es-AR")}`)
    .join("\n");

  const investmentSummary = investments
    .map((i) => {
      const current = Number(i.currentPrice ?? i.amount);
      const cost = Number(i.buyPrice) * Number(i.quantity ?? 1);
      const pnl = cost > 0 ? (((current - cost) / cost) * 100).toFixed(1) : "0.0";
      return `  - ${i.name} (${i.type}${i.symbol ? `, ${i.symbol}` : ""}): $${current.toLocaleString("es-AR")} (${pnl >= "0" ? "+" : ""}${pnl}%)`;
    })
    .join("\n");

  const recentTransactions = transactions
    .slice(0, 10)
    .map(
      (t) =>
        `  - [${t.date.toLocaleDateString("es-AR")}] ${t.type === "INCOME" ? "INGRESO" : t.type === "EXPENSE" ? "GASTO" : "TRANSFERENCIA"}: ${t.description} - $${Number(t.amount).toLocaleString("es-AR")}`
    )
    .join("\n");

  const goalsSummary = goals
    .map((g) => `  - ${g.icon} ${g.name}: $${Number(g.current).toLocaleString("es-AR")} / $${Number(g.target).toLocaleString("es-AR")} (${Number(g.target) > 0 ? Math.round((Number(g.current) / Number(g.target)) * 100) : 0}%)`)
    .join("\n");

  const subsSummary = subscriptions
    .map((s) => {
      const lastUsed = s.lastUsedAt
        ? `Último uso: ${Math.floor((Date.now() - new Date(s.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24))} días atrás`
        : "Sin uso registrado";
      return `  - ${s.name}: $${Number(s.amount).toLocaleString("es-AR")}/${s.frequency.toLowerCase()} (${lastUsed})`;
    })
    .join("\n");

  const advisorPersonality = advisor
    ? advisorPersonalities[advisor]
    : advisorPersonalities.finance;

  const systemPrompt = `${advisorPersonality}

CONTEXTO FINANCIERO DEL USUARIO:
════════════════════════════════

RESUMEN GENERAL:
  Ingresos totales del período: $${totalIncome.toLocaleString("es-AR")}
  Gastos totales del período: $${totalExpenses.toLocaleString("es-AR")}
  Balance neto: $${(totalIncome - totalExpenses).toLocaleString("es-AR")}
  Valor total de inversiones: $${investmentValue.toLocaleString("es-AR")}
  P/L de inversiones: $${(investmentValue - investmentCost).toLocaleString("es-AR")} (${investmentCost > 0 ? (((investmentValue - investmentCost) / investmentCost) * 100).toFixed(1) : "0.0"}%)

TOP GASTOS POR CATEGORÍA:
${topExpenses || "  Sin datos de gastos"}

INVERSIONES ACTIVAS:
${investmentSummary || "  Sin inversiones registradas"}

OBJETIVOS:
${goalsSummary || "  Sin objetivos definidos"}

SUSCRIPCIONES:
${subsSummary || "  Sin suscripciones registradas"}

ÚLTIMAS TRANSACCIONES:
${recentTransactions || "  Sin transacciones recientes"}

INSTRUCCIONES:
- Respondé en español argentino (vos/tu)
- Sé conciso pero completo
- Si no tenés datos suficientes, pedí más información
- Siempre fundamentá tus recomendaciones con los datos del usuario
- Usá formato con negritas y listas para facilitar la lectura`;

  const messages: AIMessage[] = [{ role: "system", content: systemPrompt }];

  for (const msg of history) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  return messages;
}
