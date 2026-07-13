import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    incomeAgg,
    expenseAgg,
    transactionCount,
    clientCount,
    activeProductCount,
    lowStockCount,
    pendingAppointmentCount,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.client.count({ where: { userId } }),
    prisma.product.count({ where: { userId, active: true } }),
    prisma.product.count({
      where: {
        userId,
        active: true,
      },
    }).catch(() => 0),
    prisma.appointment.count({
      where: {
        userId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        date: { gte: now },
      },
    }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

  let lowStock = 0;
  try {
    const allProducts = await prisma.product.findMany({
      where: { userId, active: true },
      select: { stock: true, minStock: true },
    });
    lowStock = allProducts.filter(
      (p) => p.stock <= p.minStock
    ).length;
  } catch {
    lowStock = 0;
  }

  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const agg = await prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: d, lte: monthEnd } },
      _sum: { amount: true },
    });
    monthlyTrend.push({
      month: d.toLocaleString("es-AR", { month: "short", year: "numeric" }),
      total: Number(agg._sum.amount ?? 0),
    });
  }

  const topExpenseCategories = await prisma.transaction.groupBy({
    by: ["category"],
    where: { userId, type: "EXPENSE", date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount,
    clientCount,
    activeProductCount,
    lowStockProductsCount: lowStock,
    pendingAppointmentCount,
    monthlyTrend,
    topExpenseCategories: topExpenseCategories.map((c) => ({
      category: c.category,
      total: Number(c._sum.amount ?? 0),
    })),
  });
}
