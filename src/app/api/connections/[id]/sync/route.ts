import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncConnection } from "@/lib/financial-providers/sync";

export async function POST(
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

  const result = await syncConnection(connection.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
