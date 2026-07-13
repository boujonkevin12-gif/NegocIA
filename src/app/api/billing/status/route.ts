import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userPlan = await prisma.userPlan.findUnique({
      where: { userId: session.user.id },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!userPlan) {
      return NextResponse.json({
        tier: "FREE",
        status: "ACTIVE",
        plan: PLANS.FREE,
        payments: [],
      });
    }

    return NextResponse.json({
      tier: userPlan.tier,
      status: userPlan.status,
      currentPeriodEnd: userPlan.currentPeriodEnd,
      cancelAtPeriodEnd: userPlan.cancelAtPeriodEnd,
      plan: PLANS[userPlan.tier],
      payments: userPlan.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Billing status error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
