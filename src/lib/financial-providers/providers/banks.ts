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
    authType: "oauth",
    supportedCurrencies: ["ARS", "USD", "BRL"],
  };

  async getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]> {
    // TODO: Mercado Pago OAuth flow → GET /v1/payment_methods
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]> {
    // TODO: GET /v1/investments/{user_id}/positions (fondos)
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async testConnection(credentials: Record<string, string>) {
    return { ok: false, message: "API no implementada aún" };
  }
}

export { GaliciaProvider, BrubankProvider, UaláProvider, MercadoPagoProvider };
