import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const clientId = searchParams.get("clientId");
  const productId = searchParams.get("productId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = { userId: session.user.id };
  if (clientId) where.clientId = clientId;
  if (productId) where.productId = productId;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, Date>).gte = new Date(from);
    if (to) (where.date as Record<string, Date>).lte = new Date(to);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { client: true, product: true },
    orderBy: { date: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, productId, amount, quantity, description, date } = body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "amount debe ser un número positivo" },
      { status: 400 }
    );
  }

  const sale = await prisma.$transaction(async (tx) => {
    const userId = session.user!.id as string;

    if (productId) {
      const product = await tx.product.findFirst({
        where: { id: productId, userId },
      });
      if (!product) throw new Error("Producto no encontrado");
      const decrement = quantity ?? 1;
      if (product.stock < decrement) {
        throw new Error("Stock insuficiente");
      }
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement } },
      });
    }

    return tx.sale.create({
      data: {
        userId,
        clientId: clientId || null,
        productId: productId || null,
        amount,
        quantity: quantity ?? 1,
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
    });
  });

  return NextResponse.json(sale, { status: 201 });
}
