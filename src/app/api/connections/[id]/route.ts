import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const connection = await prisma.providerConnection.findFirst({
    where: { id, userId: session.user.id },
    include: {
      syncLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!connection) {
    return NextResponse.json({ error: "Conexión no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    id: connection.id,
    providerId: connection.providerId,
    providerType: connection.providerType,
    label: connection.label,
    status: connection.status,
    lastSyncAt: connection.lastSyncAt,
    lastError: connection.lastError,
    createdAt: connection.createdAt,
    syncLogs: connection.syncLogs,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const connection = await prisma.providerConnection.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!connection) {
    return NextResponse.json({ error: "Conexión no encontrada" }, { status: 404 });
  }

  await prisma.providerConnection.update({
    where: { id },
    data: { status: "DISCONNECTED" },
  });

  return NextResponse.json({ ok: true });
}
