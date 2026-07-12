import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listProviders } from "@/lib/financial-providers/registry";
import { encryptCredentials } from "@/lib/financial-providers/encryption";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const connections = await prisma.providerConnection.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      providerId: true,
      providerType: true,
      label: true,
      status: true,
      lastSyncAt: true,
      lastError: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ connections });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { providerId, label, credentials } = await request.json();

  if (!providerId || !credentials) {
    return NextResponse.json(
      { error: "providerId y credentials son requeridos" },
      { status: 400 }
    );
  }

  const available = listProviders();
  const providerDef = available.find((p) => p.id === providerId);
  if (!providerDef) {
    return NextResponse.json(
      { error: `Provider "${providerId}" no existe. Disponibles: ${available.map((p) => p.id).join(", ")}` },
      { status: 400 }
    );
  }

  const encryptedCreds = encryptCredentials(credentials);

  const connection = await prisma.providerConnection.create({
    data: {
      userId: session.user.id,
      providerId,
      providerType: providerDef.type,
      label: label ?? providerDef.name,
      credentials: encryptedCreds,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    id: connection.id,
    providerId: connection.providerId,
    label: connection.label,
    status: connection.status,
  });
}
