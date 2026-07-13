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
  const status = searchParams.get("status") as "ACTIVE" | "INACTIVE" | "LEAD" | null;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, phone, notes, status } = body;

  if (!name) {
    return NextResponse.json({ error: "name es requerido" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      userId: session.user.id,
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      status: status || "ACTIVE",
    },
  });

  return NextResponse.json(client, { status: 201 });
}
