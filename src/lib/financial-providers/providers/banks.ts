import type { FinancialProvider, FinancialProviderDefinition, NormalizedAccount, NormalizedTransaction, NormalizedInvestment } from "../types";

class GaliciaProvider implements FinancialProvider {
  definition: FinancialProviderDefinition = {
    id: "galicia",
    name: "Banco Galicia",
    type: "BANK",
    description: "Banco Galicia - Cuentas, tarjetas y movimientos",
    authType: "credentials",
    supportedCurrencies: ["ARS", "USD"],
  };

  async getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]> {
    // TODO: Implementar cuando Galicia disponibilice su API abierta
    // Documentación esperada: Open Banking Argentina / API Galicia
    //
    // flujo típico:
    //   1. POST /auth/login con DNI + contraseña
    //   2. GET /accounts → lista de cuentas
    //   3. GET /accounts/{id}/balance → saldo
    throw new Error(`API de ${this.definition.name} no implementada aún. Próximamente.`);
  }

  async getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]> {
    // TODO: GET /accounts/{id}/transactions?from={since}
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]> {
    throw new Error(`${this.definition.name} no ofrece inversiones directamente.`);
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async testConnection(credentials: Record<string, string>) {
    return { ok: false, message: "API no implementada aún" };
  }
}

class BrubankProvider implements FinancialProvider {
  definition: FinancialProviderDefinition = {
    id: "brubank",
    name: "Brubank",
    type: "BANK",
    description: "Brubank - Banca digital, cuentas e inversiones",
    authType: "credentials",
    supportedCurrencies: ["ARS", "USD"],
  };

  async getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]> {
    // TODO: Brubank API — endpoint esperado:
    // GET /api/v1/accounts
    // Headers: Authorization: Bearer {token}
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]> {
    // TODO: GET /api/v1/transactions?from={since}&limit=100
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]> {
    // TODO: GET /api/v1/investments/portfolio
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async testConnection(credentials: Record<string, string>) {
    return { ok: false, message: "API no implementada aún" };
  }
}

class UaláProvider implements FinancialProvider {
  definition: FinancialProviderDefinition = {
    id: "uala",
    name: "Ualá",
    type: "BANK",
    description: "Ualá - Cuenta, tarjeta y wallet digital",
    authType: "credentials",
    supportedCurrencies: ["ARS", "USD"],
  };

  async getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]> {
    throw new Error(`${this.definition.name} no ofrece inversiones.`);
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async testConnection(credentials: Record<string, string>) {
    return { ok: false, message: "API no implementada aún" };
  }
}

class MercadoPagoProvider implements FinancialProvider {
  definition: FinancialProviderDefinition = {
    id: "mercadopago",
    name: "Mercado Pago",
    type: "BANK",
    description: "Mercado Pago - Wallet, cuenta y tarjeta",
    authType: "api_key",
    supportedCurrencies: ["ARS", "USD", "BRL"],
  };

  private async mpFetch(path: string, accessToken: string, params?: Record<string, string>) {
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

  async getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]> {
    const { access_token } = credentials;
    if (!access_token) throw new Error("Falta access_token de MercadoPago");

    const [balance, cards] = await Promise.all([
      this.mpFetch("/v1/payment_methods", access_token).catch(() => null),
      this.mpFetch("/v1/cards", access_token).catch(() => null),
    ]);

    const accounts: NormalizedAccount[] = [];

    accounts.push({
      externalId: "mp-wallet",
      name: "Mercado Pago - Billetera",
      type: "WALLET",
      currency: "ARS",
      balance: 0,
    });

    if (cards && cards.results) {
      for (const card of cards.results) {
        accounts.push({
          externalId: card.id,
          name: `${card.cardholder?.name || "Tarjeta"} •••• ${card.last_four_digits || "****"}`,
          type: "CREDIT_CARD",
          currency: card.currency_id || "ARS",
          balance: 0,
        });
      }
    }

    return accounts;
  }

  async getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]> {
    const { access_token } = credentials;
    if (!access_token) throw new Error("Falta access_token de MercadoPago");

    const params: Record<string, string> = {
      limit: "50",
      sort: "date_created",
      criteria: "desc",
    };

    if (since) {
      params.range = "date_created";
      params.begin_date = since.toISOString();
      params.end_date = new Date().toISOString();
    }

    const data = await this.mpFetch("/v1/payments", access_token, params);

    if (!data.results) return [];

    return data.results.map((p: Record<string, unknown>) => {
      const status = p.status as string;
      const statusDetail = p.status_detail as string;
      const amount = Number(p.transaction_amount) || 0;
      const desc = (p.description as string) || (p.external_reference as string) || "Pago MercadoPago";
      const dateStr = p.date_created as string;

      let type: "INCOME" | "EXPENSE" | "TRANSFER" = "EXPENSE";
      if (status === "approved" && statusDetail === "accredited") {
        type = "INCOME";
      } else if (status === "refunded" || status === "cancelled") {
        type = "EXPENSE";
      }

      let category = "Otros";
      const typeId = p.payment_type_id as string;
      if (typeId === "credit_card") category = "Tarjeta de crédito";
      else if (typeId === "debit_card") category = "Tarjeta de débito";
      else if (typeId === "bank_transfer") category = "Transferencia";
      else if (typeId === "cash") category = "Efectivo";
      else if (typeId === "account_money") category = "Billetera";

      return {
        externalId: String(p.id),
        amount: Math.abs(amount),
        type,
        category,
        description: desc,
        date: new Date(dateStr),
        counterparty: (p.collector as Record<string, unknown> | undefined)?.email as string | undefined,
      };
    });
  }

  async getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]> {
    return [];
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    const { access_token } = credentials;
    if (!access_token) throw new Error("Falta access_token de MercadoPago");

    const data = await this.mpFetch("/v1/payment_methods", access_token);
    return { total: 0, currency: "ARS" };
  }

  async testConnection(credentials: Record<string, string>) {
    try {
      const { access_token } = credentials;
      if (!access_token) return { ok: false, message: "Falta access_token" };

      const res = await fetch(
        `https://api.mercadopago.com/v1/payment_methods?access_token=${access_token}`
      );

      if (!res.ok) {
        return { ok: false, message: `Error ${res.status}: token inválido o expirado` };
      }

      return { ok: true, message: "Conexión exitosa con MercadoPago" };
    } catch (error) {
      return { ok: false, message: `Error de conexión: ${error}` };
    }
  }
}

export { GaliciaProvider, BrubankProvider, UaláProvider, MercadoPagoProvider };
