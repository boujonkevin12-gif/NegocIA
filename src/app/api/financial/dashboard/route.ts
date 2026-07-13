import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateInsights } from "@/lib/financial-sync/insights";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const insights = await generateInsights(session.user.id);
    return NextResponse.json(insights);
  } catch (error) {
    console.error("[FINANCIAL-DASHBOARD] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar insights" },
      { status: 500 }
    );
  }
}
