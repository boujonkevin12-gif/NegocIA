import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userPlan = await prisma.userPlan.findUnique({
      where: { userId: session.user.id },
    });

    if (!userPlan || userPlan.tier === "FREE") {
      return NextResponse.json({ error: "No hay plan que cancelar" }, { status: 400 });
    }

    // Marcar para cancelar al final del periodo
    await prisma.userPlan.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      message: "Tu plan se cancelará al final del periodo de facturación actual",
    });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
