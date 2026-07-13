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
  const sale = await prisma.sale.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true, product: true },
  });

  if (!sale) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json(sale);
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
  const existing = await prisma.sale.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const newProductId = body.productId !== undefined ? body.productId : existing.productId;
  const newQuantity = body.quantity !== undefined ? body.quantity : existing.quantity;
  const oldProductId = existing.productId;
  const oldQuantity = existing.quantity;

  const sale = await prisma.$transaction(async (tx) => {
    if (oldProductId && (!newProductId || newProductId !== oldProductId)) {
      await tx.product.update({
        where: { id: oldProductId },
        data: { stock: { increment: oldQuantity } },
      });
    }

    if (newProductId) {
      if (!oldProductId || newProductId !== oldProductId) {
        const product = await tx.product.findFirst({
          where: { id: newProductId, userId: session.user!.id },
        });
        if (!product) throw new Error("Producto no encontrado");
        if (product.stock < newQuantity) throw new Error("Stock insuficiente");
        await tx.product.update({
          where: { id: newProductId },
          data: { stock: { decrement: newQuantity } },
        });
      } else {
        const diff = newQuantity - oldQuantity;
        if (diff > 0) {
          const product = await tx.product.findFirst({
            where: { id: newProductId, userId: session.user!.id },
          });
          if (product && product.stock < diff) throw new Error("Stock insuficiente");
        }
        await tx.product.update({
          where: { id: newProductId },
          data: { stock: { decrement: diff } },
        });
      }
    }

    return tx.sale.update({
      where: { id },
      data: {
        clientId: body.clientId !== undefined ? body.clientId : existing.clientId,
        productId: newProductId,
        amount: body.amount ?? existing.amount,
        quantity: newQuantity,
        description: body.description !== undefined ? body.description : existing.description,
        date: body.date ? new Date(body.date) : existing.date,
      },
    });
  });

  return NextResponse.json(sale);
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
  const existing = await prisma.sale.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (existing.productId) {
      await tx.product.update({
        where: { id: existing.productId },
        data: { stock: { increment: existing.quantity } },
      });
    }
    await tx.sale.delete({ where: { id } });
  });

  return NextResponse.json({ message: "Eliminada" });
}
