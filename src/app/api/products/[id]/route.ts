import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!product) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.product.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description !== undefined ? body.description : existing.description,
      price: body.price ?? existing.price,
      cost: body.cost !== undefined ? body.cost : existing.cost,
      stock: body.stock ?? existing.stock,
      minStock: body.minStock ?? existing.minStock,
      sku: body.sku !== undefined ? body.sku : existing.sku,
      category: body.category !== undefined ? body.category : existing.category,
      active: body.active !== undefined ? body.active : existing.active,
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.product.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json(product);
}
