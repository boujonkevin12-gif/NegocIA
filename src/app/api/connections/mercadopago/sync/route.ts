import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/financial-providers/encryption";

export async function GET() {
  return NextResponse.json({
    info: "Este endpoint solo acepta POST. Use el botón 'Sincronizar ahora' desde la app.",
  });
}

async function mpFetch(path: string, accessToken: string, params?: Record<string, string>) {
  const url = new URL(`https://api.mercadopago.com${path}`);
  url.searchParams.append("access_token", accessToken);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.append(k, v);
    }
  }

  console.log(`[MP-SYNC] Fetching: ${url.pathname}${url.search.replace(/access_token=.*/, "access_token=***")}`);

  const res = await fetch(url.toString());
  const body = await res.text();

  if (!res.ok) {
    console.error(`[MP-SYNC] API error ${res.status} on ${path}: ${body}`);
    throw new Error(`MercadoPago API error (${res.status}): ${body}`);
  }

  console.log(`[MP-SYNC] OK ${res.status} on ${path}, body length: ${body.length}`);
  return JSON.parse(body);
}

export async function POST() {
  console.log("[MP-SYNC] === POST /api/connections/mercadopago/sync ===");

  const session = await auth();
  if (!session?.user?.id) {
    console.log("[MP-SYNC] No session, returning 401");
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  console.log("[MP-SYNC] User authenticated:", session.user.id);

  const connection = await prisma.providerConnection.findFirst({
    where: {
      userId: session.user.id,
      providerId: "mercadopago",
      status: { not: "DISCONNECTED" },
    },
  });

  if (!connection) {
    console.log("[MP-SYNC] No MP connection found for user");
    return NextResponse.json(
      { error: "No hay cuenta de MercadoPago conectada" },
      { status: 404 }
    );
  }
  console.log("[MP-SYNC] Connection found:", connection.id, "status:", connection.status);

  const credentials = decryptCredentials(connection.credentials);
  const accessToken = credentials.access_token;

  if (!accessToken) {
    console.log("[MP-SYNC] No access_token in credentials");
    return NextResponse.json(
      { error: "Token de acceso no encontrado" },
      { status: 400 }
    );
  }
  console.log("[MP-SYNC] access_token present, length:", accessToken.length, "starts with:", accessToken.substring(0, 8) + "...");

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    console.log("[MP-SYNC] todayStart:", todayStart);
    console.log("[MP-SYNC] weekStart:", weekStart);
    console.log("[MP-SYNC] monthStart:", monthStart);

    console.log("[MP-SYNC] Fetching /users/me...");
    const userInfo = await mpFetch("/users/me", accessToken).catch((err) => {
      console.error("[MP-SYNC] /users/me failed:", err.message);
      return null;
    });
    console.log("[MP-SYNC] /users/me result:", userInfo ? "OK" : "null");

    console.log("[MP-SYNC] Fetching /v1/payments/search (all)...");
    const allPayments = await mpFetch("/v1/payments/search", accessToken, {
      sort: "date_created",
      criteria: "desc",
      limit: "50",
    }).catch((err) => {
      console.error("[MP-SYNC] /v1/payments/search (all) failed:", err.message);
      return null;
    });
    console.log("[MP-SYNC] All payments result:", allPayments ? `paging.total=${allPayments.paging?.total}, results.length=${allPayments.results?.length}` : "null");

    console.log("[MP-SYNC] Fetching /v1/payments/search (today)...");
    const todayPayments = await mpFetch("/v1/payments/search", accessToken, {
      sort: "date_created",
      criteria: "desc",
      range: "date_created",
      begin_date: todayStart,
      end_date: now.toISOString(),
      limit: "50",
    }).catch((err) => {
      console.error("[MP-SYNC] /v1/payments/search (today) failed:", err.message);
      return null;
    });
    console.log("[MP-SYNC] Today payments result:", todayPayments ? `paging.total=${todayPayments.paging?.total}` : "null");

    console.log("[MP-SYNC] Fetching /v1/payments/search (week)...");
    const weekPayments = await mpFetch("/v1/payments/search", accessToken, {
      sort: "date_created",
      criteria: "desc",
      range: "date_created",
      begin_date: weekStart,
      end_date: now.toISOString(),
      limit: "50",
    }).catch((err) => {
      console.error("[MP-SYNC] /v1/payments/search (week) failed:", err.message);
      return null;
    });
    console.log("[MP-SYNC] Week payments result:", weekPayments ? `paging.total=${weekPayments.paging?.total}` : "null");

    console.log("[MP-SYNC] Fetching /v1/payments/search (month)...");
    const monthPayments = await mpFetch("/v1/payments/search", accessToken, {
      sort: "date_created",
      criteria: "desc",
      range: "date_created",
      begin_date: monthStart,
      end_date: now.toISOString(),
      limit: "50",
    }).catch((err) => {
      console.error("[MP-SYNC] /v1/payments/search (month) failed:", err.message);
      return null;
    });
    console.log("[MP-SYNC] Month payments result:", monthPayments ? `paging.total=${monthPayments.paging?.total}` : "null");

    const all = allPayments?.results ?? [];
    const today = todayPayments?.results ?? [];
    const week = weekPayments?.results ?? [];
    const month = monthPayments?.results ?? [];

    console.log("[MP-SYNC] Parsed counts:", { all: all.length, today: today.length, week: week.length, month: month.length });

    const sumAmount = (payments: { transaction_amount?: number }[]) =>
      payments.reduce((s, p) => s + (p.transaction_amount || 0), 0);

    const countByStatus = (payments: { status?: string }[], status: string) =>
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

    console.log("[MP-SYNC] Stats:", stats);

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

    console.log("[MP-SYNC] Sync completed successfully, returning", recentPayments.length, "payments");

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
    console.error("[MP-SYNC] Fatal error:", message);

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
