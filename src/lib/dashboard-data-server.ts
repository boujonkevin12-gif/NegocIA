import { prisma } from "@/lib/prisma";

export interface DashboardData {
  balance: number;
  previousBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  balanceInsight: string;
  discoveries: { id: string; icon: string; text: string; type: "warning" | "tip" | "success" | "info" }[];
  goals: { id: string; name: string; icon: string; target: number; current: number; currency: string }[];
  subscriptions: { id: string; name: string; icon: string; amount: number; frequency: string; lastUsedAt: string | null; active: boolean }[];
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [thisMonthTx, lastMonthTx, investments, goals, subscriptions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
      select: { type: true, amount: true, category: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      select: { type: true, amount: true },
    }),
    prisma.investment.findMany({
      where: { userId, status: "ACTIVE" },
      select: { name: true, amount: true, currentPrice: true, type: true, symbol: true },
    }),
    prisma.goal.findMany({
      where: { userId },
      select: { id: true, name: true, icon: true, target: true, current: true, currency: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subscription.findMany({
      where: { userId, active: true },
      select: { id: true, name: true, icon: true, amount: true, frequency: true, lastUsedAt: true, active: true },
      orderBy: { amount: "desc" },
    }),
  ]);

  const thisMonthIncome = thisMonthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const thisMonthExpenses = thisMonthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const lastMonthIncome = lastMonthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const lastMonthExpenses = lastMonthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  const balance = thisMonthIncome - thisMonthExpenses;
  const previousBalance = lastMonthIncome - lastMonthExpenses;

  const savingsRate = thisMonthIncome > 0 ? Math.round(((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100) : 0;

  let balanceInsight = "";
  if (thisMonthIncome === 0 && thisMonthExpenses === 0) {
    balanceInsight = "Conectá tu primer cuenta bancaria para ver tu análisis financiero.";
  } else if (savingsRate >= 30) {
    balanceInsight = `Tu tasa de ahorro es del ${savingsRate}%. Podrías invertir hasta $${Math.round(thisMonthIncome * 0.3).toLocaleString("es-AR")} sin afectar tus gastos.`;
  } else if (savingsRate > 0) {
    balanceInsight = `Estás ahorrando el ${savingsRate}%. Intentá llegar al 30% reduciendo gastos en categorías principales.`;
  } else {
    balanceInsight = "Tus gastos superan tus ingresos este mes. Revisá dónde podés reducir.";
  }

  const discoveries: DashboardData["discoveries"] = [];

  if (thisMonthExpenses > 0) {
    const byCategory = thisMonthTx
      .filter((t) => t.type === "EXPENSE")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
        return acc;
      }, {});

    const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
    if (sorted.length > 0) {
      const [cat, amt] = sorted[0];
      const pct = Math.round((amt / thisMonthExpenses) * 100);
      if (pct > 30) {
        discoveries.push({
          id: "high-cat",
          icon: "⚠️",
          text: `Gastaste demasiado en ${cat}. Representa el ${pct}% de tus gastos del mes.`,
          type: "warning",
        });
      }
    }
  }

  if (investments.length > 1) {
    const totalValue = investments.reduce((s, i) => s + Number(i.currentPrice ?? i.amount), 0);
    for (const inv of investments) {
      const val = Number(inv.currentPrice ?? inv.amount);
      const share = totalValue > 0 ? (val / totalValue) * 100 : 0;
      if (share > 40) {
        discoveries.push({
          id: `concentration-${inv.name}`,
          icon: "📊",
          text: `${inv.name} representa el ${Math.round(share)}% de tu cartera. Considerá diversificar.`,
          type: "tip",
        });
      }
    }
  }

  const subMonthlyTotal = subscriptions.reduce((s, sub) => {
    const amt = Number(sub.amount);
    switch (sub.frequency) {
      case "WEEKLY": return s + amt * 4;
      case "QUARTERLY": return s + amt / 3;
      case "YEARLY": return s + amt / 12;
      default: return s + amt;
    }
  }, 0);

  if (subMonthlyTotal > 0 && thisMonthIncome > 0) {
    const subPct = Math.round((subMonthlyTotal / thisMonthIncome) * 100);
    if (subPct > 10) {
      discoveries.push({
        id: "subs-cost",
        icon: "💳",
        text: `Tus suscripciones representan el ${subPct}% de tus ingresos ($${Math.round(subMonthlyTotal).toLocaleString("es-AR")}/mes).`,
        type: "warning",
      });
    }
  }

  const unusedSubs = subscriptions.filter((s) => {
    if (!s.lastUsedAt) return false;
    const days = Math.floor((now.getTime() - new Date(s.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 30;
  });

  for (const sub of unusedSubs) {
    discoveries.push({
      id: `unused-${sub.name}`,
      icon: "🔍",
      text: `No usás ${sub.name} hace más de 30 días. ¿Lo cancelás? Ahorrarías $${Math.round(Number(sub.amount)).toLocaleString("es-AR")}.`,
      type: "tip",
    });
  }

  if (balance > 0 && thisMonthIncome > 0) {
    discoveries.push({
      id: "invest-tip",
      icon: "💡",
      text: `Tenés $${Math.round(balance * 0.3).toLocaleString("es-AR")} disponibles para invertir sin comprometer tu flujo.`,
      type: "info",
    });
  }

  if (discoveries.length === 0 && thisMonthIncome > 0) {
    discoveries.push({
      id: "all-good",
      icon: "✅",
      text: "Todo en orden. Tus finanzas están bien este mes.",
      type: "success",
    });
  }

  return {
    balance,
    previousBalance,
    monthlyIncome: thisMonthIncome,
    monthlyExpenses: thisMonthExpenses,
    balanceInsight,
    discoveries: discoveries.slice(0, 6),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      target: Number(g.target),
      current: Number(g.current),
      currency: g.currency,
    })),
    subscriptions: subscriptions.map((s) => ({
      ...s,
      amount: Number(s.amount),
      frequency: s.frequency as string,
      lastUsedAt: s.lastUsedAt?.toISOString() ?? null,
    })),
  };
}
