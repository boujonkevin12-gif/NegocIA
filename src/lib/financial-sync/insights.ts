import { prisma } from "@/lib/prisma";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface FinancialInsights {
  balance: { estimated: number; income: number; expenses: number; savings: number };
  monthlyTrend: MonthlyData[];
  topCategories: CategoryBreakdown[];
  subscriptions: { name: string; monthlyCost: number; annualCost: number }[];
  anomalies: { description: string; severity: "low" | "medium" | "high"; saving: number }[];
  recommendations: { title: string; description: string; potentialSaving: number }[];
  lastImport: { date: Date; source: string; rows: number } | null;
}

export async function generateInsights(userId: string): Promise<FinancialInsights> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const entries = await prisma.financialEntry.findMany({
    where: {
      userId,
      date: { gte: sixMonthsAgo },
    },
    orderBy: { date: "asc" },
  });

  const mpPayments = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: sixMonthsAgo },
      description: { contains: "Synced from mercadopago" },
    },
    orderBy: { date: "asc" },
  });

  const allEntries = [
    ...entries.map((e) => ({
      date: e.date,
      type: e.type,
      category: e.category,
      amount: Number(e.amount),
      description: e.description,
    })),
    ...mpPayments.map((t) => ({
      date: t.date,
      type: t.type,
      category: t.category,
      amount: Number(t.amount),
      description: t.description,
    })),
  ];

  const income = allEntries
    .filter((e) => e.type === "INCOME" || (e.type === "EXPENSE" && e.amount > 0))
    .reduce((s, e) => s + Math.abs(e.amount), 0);

  const expenses = allEntries
    .filter((e) => e.type === "EXPENSE" || (e.type === "INCOME" && e.amount < 0))
    .reduce((s, e) => s + Math.abs(e.amount), 0);

  const monthlyMap = new Map<string, { income: number; expenses: number }>();
  for (const e of allEntries) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    const cur = monthlyMap.get(key) || { income: 0, expenses: 0 };
    if (e.amount > 0 || e.type === "INCOME") {
      cur.income += Math.abs(e.amount);
    } else {
      cur.expenses += Math.abs(e.amount);
    }
    monthlyMap.set(key, cur);
  }

  const monthlyTrend: MonthlyData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const data = monthlyMap.get(key) || { income: 0, expenses: 0 };
    monthlyTrend.push({
      month: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      income: data.income,
      expenses: data.expenses,
      balance: data.income - data.expenses,
    });
  }

  const categoryMap = new Map<string, { amount: number; count: number }>();
  for (const e of allEntries) {
    if (e.amount < 0 || e.type === "EXPENSE") {
      const cur = categoryMap.get(e.category) || { amount: 0, count: 0 };
      cur.amount += Math.abs(e.amount);
      cur.count += 1;
      categoryMap.set(e.category, cur);
    }
  }

  const totalExpenses = Array.from(categoryMap.values()).reduce((s, c) => s + c.amount, 0);
  const topCategories: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      trend: "stable" as const,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const subMap = new Map<string, { monthlyCost: number; count: number }>();
  for (const e of allEntries) {
    if (e.amount < 0 || e.type === "EXPENSE") {
      const upper = e.description.toUpperCase();
      for (const kw of ["NETFLIX", "SPOTIFY", "AMAZON", "DISNEY", "YOUTUBE", "APPLE", "HBO", "ADOBE", "HOSTINGER", "CLOUDFLARE", "GITHUB"]) {
        if (upper.includes(kw)) {
          const cur = subMap.get(kw) || { monthlyCost: 0, count: 0 };
          cur.monthlyCost += Math.abs(e.amount);
          cur.count += 1;
          subMap.set(kw, cur);
          break;
        }
      }
    }
  }

  const subscriptions = Array.from(subMap.entries()).map(([name, data]) => ({
    name,
    monthlyCost: data.count > 0 ? data.monthlyCost / Math.max(1, Math.ceil(data.count / 3)) : data.monthlyCost,
    annualCost: data.monthlyCost,
  }));

  const lastImport = await prisma.financialImport.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, source: true, rowsImported: true },
  });

  const recommendations: FinancialInsights["recommendations"] = [];

  if (topCategories.length > 0) {
    const topCat = topCategories[0];
    if (topCat.percentage > 30) {
      recommendations.push({
        title: `Gasto alto en ${topCat.category}`,
        description: `El ${Math.round(topCat.percentage)}% de tus gastos van a ${topCat.category} ($${Math.round(topCat.amount).toLocaleString("es-AR")}). Considerá reducir o alternar.`,
        potentialSaving: Math.round(topCat.amount * 0.15),
      });
    }
  }

  const currentMonth = monthlyTrend[monthlyTrend.length - 1];
  const prevMonth = monthlyTrend[monthlyTrend.length - 2];
  if (currentMonth && prevMonth) {
    const expenseChange = prevMonth.expenses > 0
      ? ((currentMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100
      : 0;

    if (expenseChange > 20) {
      recommendations.push({
        title: "Gastos creciendo",
        description: `Tus gastos subieron ${Math.round(expenseChange)}% respecto al mes anterior. Revisá las categorías con mayor incremento.`,
        potentialSaving: Math.round((currentMonth.expenses - prevMonth.expenses) * 0.3),
      });
    }
  }

  if (subscriptions.length > 0) {
    const totalSub = subscriptions.reduce((s, sub) => s + sub.monthlyCost, 0);
    if (totalSub > 5000) {
      recommendations.push({
        title: "Revisá tus suscripciones",
        description: `Gastás $${Math.round(totalSub).toLocaleString("es-AR")}/mes en ${subscriptions.length} suscripciones. ¿Las usás todas?`,
        potentialSaving: Math.round(totalSub * 0.2),
      });
    }
  }

  const savings = income - expenses;
  const currentMonthSavings = currentMonth ? currentMonth.balance : 0;
  if (currentMonthSavings < 0) {
    recommendations.push({
      title: "Gastás más de lo que ingresás",
      description: "Este mes estás en rojo. Priorizá gastos esenciales y revisá compras recientes.",
      potentialSaving: Math.abs(currentMonthSavings),
    });
  }

  return {
    balance: {
      estimated: savings,
      income,
      expenses,
      savings,
    },
    monthlyTrend,
    topCategories,
    subscriptions,
    anomalies: [],
    recommendations,
    lastImport: lastImport
      ? { date: lastImport.createdAt, source: lastImport.source, rows: lastImport.rowsImported }
      : null,
  };
}
