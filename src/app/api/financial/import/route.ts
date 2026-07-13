import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseMercadoPagoCSV } from "@/lib/financial-sync/csv-parser";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const source = (formData.get("source") as string) || "mercadopago_csv";

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera 10MB" }, { status: 400 });
    }

    const csvText = await file.text();
    const { entries, anomalies, subscriptions, dateRange } = parseMercadoPagoCSV(csvText);

    if (entries.length === 0) {
      return NextResponse.json({ error: "No se encontraron movimientos válidos en el CSV" }, { status: 400 });
    }

    const importRecord = await prisma.financialImport.create({
      data: {
        userId: session.user.id,
        source,
        fileName: file.name,
        fileSize: file.size,
        status: "PROCESSING",
        rowsTotal: entries.length,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
      },
    });

    let imported = 0;
    let skipped = 0;

    const BATCH = 50;
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);

      const existingDescs = await prisma.financialEntry.findMany({
        where: {
          userId: session.user.id,
          source: "mercadopago",
          description: { in: batch.map((e) => e.description) },
          date: { in: batch.map((e) => e.date) },
        },
        select: { description: true, date: true },
      });

      const existingSet = new Set(
        existingDescs.map((e) => `${e.description}_${e.date.toISOString()}`)
      );

      for (const entry of batch) {
        const key = `${entry.description}_${entry.date.toISOString()}`;
        if (existingSet.has(key)) {
          skipped++;
          continue;
        }

        await prisma.financialEntry.create({
          data: {
            userId: session.user.id,
            importId: importRecord.id,
            source: "mercadopago",
            externalId: entry.externalId,
            type: entry.type,
            category: entry.category,
            subcategory: entry.subcategory,
            amount: entry.amount,
            currency: "ARS",
            description: entry.description,
            counterparty: entry.counterparty,
            date: entry.date,
          },
        });
        imported++;
      }
    }

    await prisma.financialImport.update({
      where: { id: importRecord.id },
      data: {
        status: imported > 0 ? "COMPLETED" : "PARTIAL",
        rowsImported: imported,
        rowsSkipped: skipped,
      },
    });

    return NextResponse.json({
      ok: true,
      importId: importRecord.id,
      rowsTotal: entries.length,
      rowsImported: imported,
      rowsSkipped: skipped,
      dateRange,
      anomaliesCount: anomalies.length,
      subscriptionsDetected: subscriptions.size,
      topCategories: Array.from(
        entries
          .filter((e) => e.amount < 0 || e.type === "EXPENSE")
          .reduce((map, e) => {
            const cur = map.get(e.category) || 0;
            map.set(e.category, cur + Math.abs(e.amount));
            return map;
          }, new Map<string, number>())
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount })),
    });
  } catch (error) {
    console.error("[CSV-IMPORT] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar CSV" },
      { status: 500 }
    );
  }
}
