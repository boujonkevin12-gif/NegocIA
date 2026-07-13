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
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!transaction) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json(transaction);
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
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      type: body.type ?? existing.type,
      category: body.category ?? existing.category,
      amount: body.amount ?? existing.amount,
      description: body.description !== undefined ? body.description : existing.description,
      date: body.date ? new Date(body.date) : existing.date,
    },
  });

  return NextResponse.json(transaction);
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
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ message: "Eliminada" });
}
