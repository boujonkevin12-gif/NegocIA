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
  const client = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: {
        select: { sales: true, appointments: true },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(client);
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
  const existing = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const client = await prisma.client.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      email: body.email !== undefined ? body.email : existing.email,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      status: body.status ?? existing.status,
    },
  });

  return NextResponse.json(client);
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
  const existing = await prisma.client.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.client.delete({ where: { id } });

  return NextResponse.json({ message: "Eliminado" });
}
