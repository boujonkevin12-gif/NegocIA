import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status") as
    | "SCHEDULED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | null;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, Date>).gte = new Date(from);
    if (to) (where.date as Record<string, Date>).lte = new Date(to);
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { client: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, title, description, date, duration, status } = body;

  if (!title || !date) {
    return NextResponse.json(
      { error: "title y date son requeridos" },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: session.user.id,
      clientId: clientId || null,
      title,
      description: description || null,
      date: new Date(date),
      duration: duration ?? 60,
      status: status || "SCHEDULED",
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
