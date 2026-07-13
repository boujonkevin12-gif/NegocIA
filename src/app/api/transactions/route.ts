import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "INCOME" | "EXPENSE" | "TRANSFER" | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = { userId: session.user.id };
  if (type) where.type = type;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, Date>).gte = new Date(from);
    if (to) (where.date as Record<string, Date>).lte = new Date(to);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { type, category, amount, description, date } = body;

  if (!type || !category || amount == null) {
    return NextResponse.json(
      { error: "type, category y amount son requeridos" },
      { status: 400 }
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "amount debe ser un número positivo" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type,
      category,
      amount,
      description: description || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
