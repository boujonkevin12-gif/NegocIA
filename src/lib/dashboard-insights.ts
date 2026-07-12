import { prisma } from "@/lib/prisma";

export interface DashboardInsight {
  id: string;
  icon: string;
  text: string;
  type: "opportunity" | "warning" | "info" | "success";
}

export async function getDashboardInsights(userId: string): Promise<DashboardInsight[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [thisMonthTransactions, lastMonthTransactions, investments] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
      select: { type: true, amount: true, category: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      select: { type: true, amount: true, category: true },
    }),
    prisma.investment.findMany({
      where: { userId, status: "ACTIVE" },
      select: { name: true, amount: true, currentPrice: true, type: true },
    }),
  ]);

  const insights: DashboardInsight[] = [];

  const thisMonthIncome = thisMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const thisMonthExpenses = thisMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lastMonthIncome = lastMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const currentBalance = thisMonthIncome - thisMonthExpenses;
  const lastBalance = lastMonthIncome - lastMonthExpenses;

  const investmentValue = investments.reduce(
    (sum, i) => sum + Number(i.currentPrice ?? i.amount),
    0
  );
  const investmentCost = investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const investmentChange = investmentCost > 0
    ? ((investmentValue - investmentCost) / investmentCost) * 100
    : 0;

  if (thisMonthExpenses > 0 && thisMonthIncome > 0) {
    const savingsRate = ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100;
    if (savingsRate < 30) {
      const potentialSavings = thisMonthIncome * 0.1;
      insights.push({
        id: "savings",
        icon: "💰",
        text: `Podrías ahorrar $${Math.round(potentialSavings).toLocaleString("es-AR")} este mes reduciendo gastos innecesarios`,
        type: "opportunity",
      });
    } else {
      insights.push({
        id: "savings",
        icon: "💰",
        text: `Tu tasa de ahorro es del ${Math.round(savingsRate)}%. ¡Excelente!`,
        type: "success",
      });
    }
  }

  if (lastBalance > 0 && currentBalance > 0) {
    const balanceChange = ((currentBalance - lastBalance) / lastBalance) * 100;
    if (balanceChange > 0) {
      insights.push({
        id: "patrimony",
        icon: "📈",
        text: `Tu patrimonio aumentó ${balanceChange.toFixed(1)}% este mes`,
        type: "success",
      });
    } else if (balanceChange < 0) {
      insights.push({
        id: "patrimony",
        icon: "📉",
        text: `Tu patrimonio bajó ${Math.abs(balanceChange).toFixed(1)}% este mes. Revisá tus gastos`,
        type: "warning",
      });
    }
  }

  const expensesByCategory = thisMonthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
      return acc;
    }, {});

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
  const highExpenseCategories = Object.entries(expensesByCategory)
    .filter(([, amount]) => totalExpenses > 0 && amount / totalExpenses > 0.25)
    .sort(([, a], [, b]) => b - a);

  if (highExpenseCategories.length > 0) {
    const topCategory = highExpenseCategories[0];
    insights.push({
      id: "high-expense",
      icon: "⚠️",
      text: `${topCategory[0]} representa el ${Math.round((topCategory[1] / totalExpenses) * 100)}% de tus gastos ($${Math.round(topCategory[1]).toLocaleString("es-AR")})`,
      type: "warning",
    });
  }

  if (investmentChange !== 0) {
    const direction = investmentChange > 0 ? "subió" : "bajó";
    insights.push({
      id: "investment",
      icon: "📊",
      text: `Tus inversiones ${direction} ${Math.abs(investmentChange).toFixed(1)}% — valor total: $${Math.round(investmentValue).toLocaleString("es-AR")}`,
      type: investmentChange > 0 ? "success" : "info",
    });
  }

  if (thisMonthTransactions.length === 0 && investments.length === 0) {
    insights.push(
      {
        id: "welcome-1",
        icon: "🚀",
        text: "Conectá tu primer cuenta bancaria o broker para empezar a analizar tus finanzas",
        type: "info",
      },
      {
        id: "welcome-2",
        icon: "💬",
        text: "Preguntame anything sobre finanzas personales, inversiones o impuestos",
        type: "info",
      }
    );
  }

  if (insights.length === 0) {
    insights.push({
      id: "default",
      icon: "✨",
      text: "Registra tus primeras transacciones para obtener insights personalizados",
      type: "info",
    });
  }

  return insights.slice(0, 6);
}
