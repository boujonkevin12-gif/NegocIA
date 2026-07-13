import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, data } = body;

    // MercadoPago envía notificaciones de tipo "payment"
    if (type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "MP not configured" }, { status: 500 });
    }

    // Obtener detalles del pago desde MercadoPago
    const mpPayment = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}?access_token=${accessToken}`
    );

    if (!mpPayment.ok) {
      return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
    }

    const payment = await mpPayment.json();

    const { status, status_detail, transaction_amount, payment_type_id, description } = payment;
    const externalRef = payment.external_reference; // userId

    if (!externalRef) {
      return NextResponse.json({ error: "No external reference" }, { status: 400 });
    }

    // Buscar el UserPlan del usuario
    const userPlan = await prisma.userPlan.findUnique({
      where: { userId: externalRef },
    });

    if (!userPlan) {
      return NextResponse.json({ error: "No user plan found" }, { status: 404 });
    }

    // Registrar el pago
    await prisma.payment.create({
      data: {
        userPlanId: userPlan.id,
        mercadopagoPaymentId: String(paymentId),
        amount: transaction_amount,
        currency: payment.currency_id || "ARS",
        status: status,
        paymentMethod: payment_type_id,
        description: description || `Pago NegocIA`,
      },
    });

    // Activar plan si el pago fue aprobado
    if (status === "approved" && status_detail === "accredited") {
      await prisma.userPlan.update({
        where: { userId: externalRef },
        data: {
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: getNextMonth(),
          cancelAtPeriodEnd: false,
        },
      });
    } else if (status === "cancelled" || status === "refunded") {
      // Si el pago fue cancelado o reembolsado, mantener el plan actual pero marcar
      await prisma.userPlan.update({
        where: { userId: externalRef },
        data: {
          status: "PAST_DUE",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function getNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
