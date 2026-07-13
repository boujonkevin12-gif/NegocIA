import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/financial-providers/encryption";

async function mpFetch(path: string, accessToken: string, params?: Record<string, string>) {
  const url = new URL(`https://api.mercadopago.com${path}`);
  url.searchParams.append("access_token", accessToken);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.append(k, v);
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`MP API error ${res.status}`);
  return res.json();
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  const connection = await prisma.providerConnection.findFirst({
    where: {
      userId: session.user.id,
      providerId: "mercadopago",
      status: "ACTIVE",
    },
  });

  if (!connection) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  if (connection.lastSyncAt) {
    const lastSync = new Date(connection.lastSyncAt).getTime();
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    if (lastSync > fiveMinAgo) {
      return NextResponse.json({ ok: false, skipped: true, reason: "recently_synced" });
    }
  }

  try {
    const credentials = decryptCredentials(connection.credentials);
    const accessToken = credentials.access_token;
    if (!accessToken) throw new Error("No access_token");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [userInfo, allPayments, todayPayments, weekPayments, monthPayments] = await Promise.all([
      mpFetch("/users/me", accessToken).catch(() => null),
      mpFetch("/v1/payments/search", accessToken, {
        sort: "date_created", criteria: "desc", limit: "50",
      }).catch(() => null),
      mpFetch("/v1/payments/search", accessToken, {
        sort: "date_created", criteria: "desc", range: "date_created",
        begin_date: todayStart, end_date: now.toISOString(), limit: "50",
      }).catch(() => null),
      mpFetch("/v1/payments/search", accessToken, {
        sort: "date_created", criteria: "desc", range: "date_created",
        begin_date: weekStart, end_date: now.toISOString(), limit: "50",
      }).catch(() => null),
      mpFetch("/v1/payments/search", accessToken, {
        sort: "date_created", criteria: "desc", range: "date_created",
        begin_date: monthStart, end_date: now.toISOString(), limit: "50",
      }).catch(() => null),
    ]);

    const all = allPayments?.results ?? [];
    const today = todayPayments?.results ?? [];
    const week = weekPayments?.results ?? [];
    const month = monthPayments?.results ?? [];

    const sumAmount = (payments: Record<string, unknown>[]) =>
      payments.reduce((s: number, p: Record<string, unknown>) => s + (Number(p.transaction_amount) || 0), 0);
    const countByStatus = (payments: Record<string, unknown>[], status: string) =>
      payments.filter((p: Record<string, unknown>) => p.status === status).length;

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

    const recentPayments = all.slice(0, 20).map((p: Record<string, unknown>) => ({
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
      collectorEmail: (p.collector as Record<string, unknown> | undefined)?.email || "",
    }));

    const userInfoData = userInfo
      ? {
          id: (userInfo as Record<string, unknown>).id,
          firstName: (userInfo as Record<string, unknown>).first_name,
          lastName: (userInfo as Record<string, unknown>).last_name,
          email: (userInfo as Record<string, unknown>).email,
          siteId: (userInfo as Record<string, unknown>).site_id,
        }
      : null;

    await prisma.providerConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: now,
        lastError: null,
        status: "ACTIVE",
        label: userInfoData
          ? `${userInfoData.firstName} ${userInfoData.lastName}`.trim()
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
        balance: "MercadoPago no ofrece API pública para saldo disponible.",
        investments: "Inversiones no disponibles vía API.",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, skipped: true });
  }
}
