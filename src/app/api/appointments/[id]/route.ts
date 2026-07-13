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
  const appointment = await prisma.appointment.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(appointment);
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
  const existing = await prisma.appointment.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      clientId: body.clientId !== undefined ? body.clientId : existing.clientId,
      title: body.title ?? existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      date: body.date ? new Date(body.date) : existing.date,
      duration: body.duration ?? existing.duration,
      status: body.status ?? existing.status,
    },
  });

  return NextResponse.json(appointment);
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
  const existing = await prisma.appointment.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.appointment.delete({ where: { id } });

  return NextResponse.json({ message: "Eliminado" });
}
