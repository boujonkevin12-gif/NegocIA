export interface ParsedRow {
  date: Date;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: string;
  subcategory: string;
  amount: number;
  description: string;
  counterparty: string;
  externalId: string;
  raw: Record<string, string>;
}

const TYPE_MAP: Record<string, { type: "INCOME" | "EXPENSE" | "TRANSFER"; category: string }> = {
  SETTLEMENT: { type: "INCOME", category: "Cobros" },
  SETTLEMENT_SHIPPING: { type: "INCOME", category: "Cobros" },
  REFUND: { type: "EXPENSE", category: "Reembolsos" },
  REFUND_SHIPPING: { type: "EXPENSE", category: "Reembolsos" },
  CHARGEBACK: { type: "EXPENSE", category: "Contracargos" },
  CHARGEBACK_SHIPPING: { type: "EXPENSE", category: "Contracargos" },
  DISPUTE: { type: "EXPENSE", category: "Reclamos" },
  DISPUTE_SHIPPING: { type: "EXPENSE", category: "Reclamos" },
  WITHDRAWAL: { type: "TRANSFER", category: "Retiros" },
  CASHBACK: { type: "INCOME", category: "Cashback" },
  FEE: { type: "EXPENSE", category: "Comisiones" },
  COMMISSION: { type: "EXPENSE", category: "Comisiones" },
  COST: { type: "EXPENSE", category: "Costos" },
  TAX: { type: "EXPENSE", category: "Impuestos" },
  FINANCING: { type: "EXPENSE", category: "Financiación" },
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Combustible": ["YPF", "SHELL", "PETROBRAS", "AXION", "COMBUSTIBLE", "GNC", "GAS"],
  "Supermercado": ["COTO", "JUMBO", "DISCO", "Carrefour", "LIDER", "MAYORISTA", "VERDULERIA"],
  "Restaurantes": ["RAPPI", "PEDIDOSYA", "IFOOD", "RESTAURANT", "COMIDA", "PIZZA", "HAMBURGUESA", "MCDONALD", "BURGER", "SUSHI"],
  "Transporte": ["UBER", "DIDI", "CABIFY", "REMIS", "TAXI", "SUBE", "Combustible", "ESTACIONAMIENTO", "PEAJE", "YPF", "SHELL"],
  "Tecnología": ["APPLE", "GOOGLE", "MICROSOFT", "SPOTIFY", "NETFLIX", "ADOBE", "HOSTINGER", "CLOUDFLARE", "GITHUB"],
  "Servicios": ["EDENOR", "EDESUR", "AYSA", "GAS NATURAL", "TELECOM", "CLARO", "MOVISTAR", "PERSONAL", "FLOW", "DIRECTV"],
  "Salud": ["FARMACIA", "DR. ", "CLINICA", "HOSPITAL", "SALUD", "MEDIC", "OSDE", "SWISS", "GALENO"],
  "Educación": ["CURSO", "UNIVERSIDAD", "UDEMY", "PLATZI", "EDX", "COURSERA", "CODERHOUSE", "SOYHENRY"],
  "Suscripciones": ["NETFLIX", "SPOTIFY", "AMAZON PRIME", "DISNEY", "HBO", "YOUTUBE PREMIUM", "APPLE TV", "CRUNCHYROLL"],
  "Ropa": ["ZARA", "H&M", "NIKE", "ADIDAS", "SHEIN", "MERCADO LIBRE", "FALABELLA", "RIP CURL"],
  "Hogar": ["CASA", "DECORACION", "FERRETERIA", "CONSTRUIR", "MATERIALES", "LOSA"],
};

function guessCategory(description: string): { category: string; subcategory: string } {
  const upper = description.toUpperCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (upper.includes(kw)) {
        return { category, subcategory: kw };
      }
    }
  }

  return { category: "Otros", subcategory: "" };
}

function detectSubscriptions(entries: ParsedRow[]): Map<string, number> {
  const byDescription = new Map<string, number>();
  for (const e of entries) {
    const key = e.description.toUpperCase().replace(/\s+/g, " ").trim();
    byDescription.set(key, (byDescription.get(key) || 0) + 1);
  }

  const recurring = new Map<string, number>();
  for (const [desc, count] of byDescription) {
    if (count >= 2) {
      recurring.set(desc, count);
    }
  }
  return recurring;
}

function detectAnomalies(entries: ParsedRow[]): { description: string; amount: number; date: Date }[] {
  const anomalies: { description: string; amount: number; date: Date }[] = [];

  const byCategory = new Map<string, number[]>();
  for (const e of entries) {
    if (e.type === "EXPENSE") {
      const arr = byCategory.get(e.category) || [];
      arr.push(e.amount);
      byCategory.set(e.category, arr);
    }
  }

  for (const [category, amounts] of byCategory) {
    if (amounts.length < 3) continue;
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((s, a) => s + (a - avg) ** 2, 0) / amounts.length);
    const threshold = avg + 2 * stdDev;

    for (const e of entries) {
      if (e.category === category && e.amount > threshold) {
        anomalies.push({
          description: `${e.description} (${category}) — $${e.amount.toLocaleString("es-AR")} vs promedio $${Math.round(avg).toLocaleString("es-AR")}`,
          amount: e.amount,
          date: e.date,
        });
      }
    }
  }

  return anomalies;
}

export function parseMercadoPagoCSV(csvText: string): {
  entries: ParsedRow[];
  anomalies: { description: string; amount: number; date: Date }[];
  subscriptions: Map<string, number>;
  dateRange: { from: Date; to: Date } | null;
} {
  const lines = csvText.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    throw new Error("El archivo CSV está vacío o no tiene datos");
  }

  const headerLine = lines[0];
  const separator = headerLine.includes(";") ? ";" : ",";
  const headers = headerLine.split(separator).map((h) => h.trim().replace(/^"|"$/g, "").toUpperCase());

  const dateIdx = headers.findIndex((h) =>
    h.includes("DATE") || h.includes("FECHA") || h.includes("CREATED")
  );
  const typeIdx = headers.findIndex((h) =>
    h.includes("TYPE") || h.includes("TIPO") || h.includes("TRANSACTION")
  );
  const amountIdx = headers.findIndex((h) =>
    h.includes("NET") || h.includes("AMOUNT") || h.includes("MONTO") || h.includes("IMPORTE")
  );
  const descIdx = headers.findIndex((h) =>
    h.includes("DESCRIPTION") || h.includes("DESCRIPCION") || h.includes("REFERENCIA")
  );
  const idIdx = headers.findIndex((h) =>
    h.includes("SOURCE") || h.includes("ID") || h.includes("REFERENCE")
  );
  const counterpartyIdx = headers.findIndex((h) =>
    h.includes("COUNTERPARTY") || h.includes("CONTRAPARTE") || h.includes("PAYER") || h.includes("COMPRADOR")
  );

  if (dateIdx === -1) throw new Error("No se encontró columna de fecha en el CSV");
  if (amountIdx === -1) throw new Error("No se encontró columna de monto en el CSV");

  const entries: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = lines[i].split(separator).map((c) => c.trim().replace(/^"|"$/g, ""));

      const rawDate = cols[dateIdx];
      let date: Date;

      if (rawDate.includes("T")) {
        date = new Date(rawDate);
      } else if (rawDate.includes("/")) {
        const parts = rawDate.split("/");
        date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      } else if (rawDate.includes("-")) {
        date = new Date(rawDate);
      } else {
        date = new Date(rawDate);
      }

      if (isNaN(date.getTime())) {
        errors.push(`Fila ${i + 1}: fecha inválida "${rawDate}"`);
        continue;
      }

      const rawAmount = (cols[amountIdx] || "0").replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
      const amount = parseFloat(rawAmount) || 0;

      if (amount === 0) continue;

      const rawType = (typeIdx >= 0 ? cols[typeIdx] : "").toUpperCase().trim();
      const typeConfig = TYPE_MAP[rawType] || (amount > 0
        ? { type: "INCOME" as const, category: "Ingresos" }
        : { type: "EXPENSE" as const, category: "Gastos" });

      const description = descIdx >= 0 ? cols[descIdx] || cols[0] || "Movimiento" : cols[0] || "Movimiento";
      const counterparty = counterpartyIdx >= 0 ? cols[counterpartyIdx] || "" : "";
      const externalId = idIdx >= 0 ? cols[idIdx] || "" : "";

      const guessed = guessCategory(description + " " + counterparty);

      entries.push({
        date,
        type: typeConfig.type,
        category: typeConfig.category !== "Cobros" && typeConfig.category !== "Retiros"
          ? typeConfig.category
          : guessed.category,
        subcategory: guessed.subcategory || typeConfig.category,
        amount: Math.abs(amount) * (typeConfig.type === "EXPENSE" ? -1 : 1),
        description,
        counterparty,
        externalId: `${i}_${externalId}`,
        raw: Object.fromEntries(headers.map((h, idx) => [h, cols[idx] || ""])),
      });
    } catch {
      errors.push(`Fila ${i + 1}: error de parsing`);
    }
  }

  const dates = entries.map((e) => e.date.getTime()).filter((d) => !isNaN(d));
  const dateRange = dates.length > 0
    ? { from: new Date(Math.min(...dates)), to: new Date(Math.max(...dates)) }
    : null;

  const anomalies = detectAnomalies(entries);
  const subscriptions = detectSubscriptions(entries);

  if (errors.length > 0) {
    console.log(`[CSV-PARSER] ${errors.length} errors during parsing:`, errors.slice(0, 5));
  }

  return { entries, anomalies, subscriptions, dateRange };
}
