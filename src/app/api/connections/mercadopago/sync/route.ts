import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/financial-providers/encryption";

interface MPPayment {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  description: string;
  external_reference: string;
  date_created: string;
  date_approved: string | null;
  payment_type_id: string;
  payment_method_id: string;
  collector: { id: number; email: string } | undefined;
}

interface MPSearchResponse {
  paging: { total: number; limit: number; offset: number };
  results: MPPayment[];
}

interface MPUserInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  site_id: string;
  identification: { type: string; number: string } | undefined;
}

async function mpFetch(path: string, accessToken: string, params?: Record<string, string>) {
  const url = new URL(`https://api.mercadopago.com${path}`);
  url.searchParams.append("access_token", accessToken);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.append(k, v);
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MercadoPago API error (${res.status}): ${err}`);
  }
  return res.json();
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const connection = await prisma.providerConnection.findFirst({
    where: {
      userId: session.user.id,
      providerId: "mercadopago",
      status: { not: "DISCONNECTED" },
    },
  });

  if (!connection) {
    return NextResponse.json(
      { error: "No hay cuenta de MercadoPago conectada" },
      { status: 404 }
    );
  }

  const credentials = decryptCredentials(connection.credentials);
  const accessToken = credentials.access_token;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Token de acceso no encontrado" },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      userInfo,
      allPayments,
      todayPayments,
      weekPayments,
      monthPayments,
    ] = await Promise.all([
      mpFetch("/users/me", accessToken).catch(() => null) as Promise<MPUserInfo | null>,
      mpFetch("/v1/payments/search", accessToken, {
        sort: "date_created",
        criteria: "desc",
        limit: "50",
      }).catch(() => null) as Promise<MPSearchResponse | null>,
      mpFetch("/v1/payments/search", accessToken, {
        sort: "date_created",
        criteria: "desc",
        range: "date_created",
        begin_date: todayStart,
        end_date: now.toISOString(),
        limit: "50",
      }).catch(() => null) as Promise<MPSearchResponse | null>,
      mpFetch("/v1/payments/search", accessToken, {
        sort: "date_created",
        criteria: "desc",
        range: "date_created",
        begin_date: weekStart,
        end_date: now.toISOString(),
        limit: "50",
      }).catch(() => null) as Promise<MPSearchResponse | null>,
      mpFetch("/v1/payments/search", accessToken, {
        sort: "date_created",
        criteria: "desc",
        range: "date_created",
        begin_date: monthStart,
        end_date: now.toISOString(),
        limit: "50",
      }).catch(() => null) as Promise<MPSearchResponse | null>,
    ]);

    const all = allPayments?.results ?? [];
    const today = todayPayments?.results ?? [];
    const week = weekPayments?.results ?? [];
    const month = monthPayments?.results ?? [];

    const sumAmount = (payments: MPPayment[]) =>
      payments.reduce((s, p) => s + (p.transaction_amount || 0), 0);

    const countByStatus = (payments: MPPayment[], status: string) =>
      payments.filter((p) => p.status === status).length;

    const stats = {
      totalPayments: allPayments?.paging?.total ?? all.length,
      totalAmount: sumAmount(all),
      todayCount: todayPayments?.paging?.total ?? today.length,
      todayAmount: sumAmount(today),
      weekCount: weekPayments?.paging?.total ?? week.length,
      weekAmount: sumAmount(week),
      monthCount: monthPayments?.paging?.total ?? month.length,
      monthAmount: sumAmount(month),
      approved: countByStatus(all, "approved"),
      pending: countByStatus(all, "pending"),
      rejected: countByStatus(all, "rejected") + countByStatus(all, "cancelled"),
      refunded: countByStatus(all, "refunded"),
    };

    const recentPayments = all.slice(0, 20).map((p) => ({
      id: p.id,
      status: p.status,
      statusDetail: p.status_detail,
      amount: p.transaction_amount,
      currency: p.currency_id,
      description: p.description || p.external_reference || "Pago",
      dateCreated: p.date_created,
      dateApproved: p.date_approved,
      type: p.payment_type_id,
      method: p.payment_method_id,
      collectorEmail: p.collector?.email || "",
    }));

    const userInfoData = userInfo
      ? {
          id: userInfo.id,
          firstName: userInfo.first_name,
          lastName: userInfo.last_name,
          email: userInfo.email,
          siteId: userInfo.site_id,
        }
      : null;

    await prisma.providerConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: now,
        lastError: null,
        status: "ACTIVE",
        label: userInfo
          ? `${userInfo.first_name} ${userInfo.last_name}`.trim()
          : connection.label,
      },
    });

    return NextResponse.json({
      ok: true,
      syncedAt: now.toISOString(),
      user: userInfoData,
      stats,
      recentPayments,
      limitations: {
        balance: "MercadoPago no ofrece API pública para saldo disponible. Mostrá tu saldo en la app de MP.",
        investments: "Las inversiones (Plazo Fondo, CEDEARs, etc.) no están disponibles vía API.",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    await prisma.providerConnection.update({
      where: { id: connection.id },
      data: {
        lastError: message,
        status: "ERROR",
      },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
