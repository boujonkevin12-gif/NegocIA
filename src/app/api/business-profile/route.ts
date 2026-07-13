import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile || null);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    businessName,
    logoUrl,
    cuit,
    address,
    phone,
    email,
    website,
    description,
    openingHours,
  } = body;

  if (!businessName) {
    return NextResponse.json(
      { error: "businessName es requerido" },
      { status: 400 }
    );
  }

  const profile = await prisma.businessProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      businessName,
      logoUrl: logoUrl || null,
      cuit: cuit || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      description: description || null,
      openingHours: openingHours || null,
    },
    update: {
      businessName,
      logoUrl: logoUrl !== undefined ? logoUrl : undefined,
      cuit: cuit !== undefined ? cuit : undefined,
      address: address !== undefined ? address : undefined,
      phone: phone !== undefined ? phone : undefined,
      email: email !== undefined ? email : undefined,
      website: website !== undefined ? website : undefined,
      description: description !== undefined ? description : undefined,
      openingHours: openingHours !== undefined ? openingHours : undefined,
    },
  });

  return NextResponse.json(profile);
}
