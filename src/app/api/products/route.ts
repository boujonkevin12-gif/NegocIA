import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const active = searchParams.get("active");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (active !== null && active !== undefined) where.active = active === "true";
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, price, cost, stock, minStock, sku, category } = body;

  if (!name || price == null) {
    return NextResponse.json(
      { error: "name y price son requeridos" },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      userId: session.user.id,
      name,
      description: description || null,
      price,
      cost: cost ?? null,
      stock: stock ?? 0,
      minStock: minStock ?? 0,
      sku: sku || null,
      category: category || null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
