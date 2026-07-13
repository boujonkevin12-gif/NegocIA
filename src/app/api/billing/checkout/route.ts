import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, type PlanTier } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { tier } = await request.json();

    if (!tier || !["PRO", "PREMIUM"].includes(tier)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const plan = getPlan(tier as PlanTier);
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ error: "MercadoPago no configurado" }, { status: 500 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Crear preferencia de pago en MercadoPago
    const preferenceBody = {
      items: [
        {
          id: `negocia-${tier.toLowerCase()}`,
          title: `NegocIA ${plan.name}`,
          description: plan.description,
          unit_price: plan.price,
          quantity: 1,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: session.user.email,
      },
      external_reference: session.user.id,
      back_urls: {
        success: `${baseUrl}/dashboard?payment=success&tier=${tier}`,
        failure: `${baseUrl}/dashboard?payment=failed`,
        pending: `${baseUrl}/dashboard?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      statement_descriptor: "NEGOCIA",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpResponse.ok) {
      const err = await mpResponse.text();
      console.error("MercadoPago preference error:", err);
      return NextResponse.json({ error: "Error creando preferencia de pago" }, { status: 500 });
    }

    const preference = await mpResponse.json();

    // Guardar preferencia en UserPlan
    await prisma.userPlan.upsert({
      where: { userId: session.user.id },
      update: {
        mercadopagoPreferId: preference.id,
        mercadopagoInitPoin: preference.init_point,
      },
      create: {
        userId: session.user.id,
        tier: tier as PlanTier,
        status: "ACTIVE",
        mercadopagoPreferId: preference.id,
        mercadopagoInitPoin: preference.init_point,
      },
    });

    return NextResponse.json({
      checkoutUrl: preference.init_point,
      preferenceId: preference.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
