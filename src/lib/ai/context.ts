import { prisma } from "@/lib/prisma";
import type { AIMessage } from "./types";

export async function buildFinancialContext(
  userId: string,
  history: { role: string; content: string }[]
): Promise<AIMessage[]> {
  const [transactions, investments] = await Promise.all([
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

  const systemPrompt = `Sos NegocIA, un asistente financiero inteligente especializado en ayudar a personas y negocios a gestionar su dinero, inversiones y finanzas personales.

CONTEXTO FINANCIERO DEL USUARIO:
═══════════════════════════════

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

ÚLTIMAS TRANSACCIONES:
${recentTransactions || "  Sin transacciones recientes"}`;

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
