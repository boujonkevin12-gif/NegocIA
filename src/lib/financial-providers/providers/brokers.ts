import type { FinancialProvider, FinancialProviderDefinition, NormalizedAccount, NormalizedTransaction, NormalizedInvestment } from "../types";

class IOLProvider implements FinancialProvider {
  definition: FinancialProviderDefinition = {
    id: "iol",
    name: "InvertirOnline",
    type: "BROKER",
    description: "IOL - Acciones, bonos, CEDEARs, fondos y plazos fijos",
    authType: "credentials",
    supportedCurrencies: ["ARS", "USD"],
  };

  async getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]> {
    // TODO: IOL API — flujo:
    //   1. POST https://api.invertironline.com/api/v2/Token/Authentication con usuario + contraseña
    //   2. GET /api/v2/Cuentas → cuentas disponibles
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]> {
    // TODO: GET /api/v2/Operaciones/Consultar?fechaDesde={since}
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]> {
    // TODO: GET /api/v2/Cuentas/{cuentaId}/Portafolio
    // Retorna: acciones, bonos, CEDEARs con precio actual, cantidad, P/L
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    // TODO: GET /api/v2/Cuentas/{cuentaId}/Saldos
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async testConnection(credentials: Record<string, string>) {
    return { ok: false, message: "API no implementada aún" };
  }
}

class PPIProvider implements FinancialProvider {
  definition: FinancialProviderDefinition = {
    id: "ppi",
    name: "Portfolio Personal Inversiones",
    type: "BROKER",
    description: "PPI - Inversiones, bonos, acciones y plazos fijos",
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
    // TODO: GET /api/v1/portfolio → posiciones
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async testConnection(credentials: Record<string, string>) {
    return { ok: false, message: "API no implementada aún" };
  }
}

class BalanzProvider implements FinancialProvider {
  definition: FinancialProviderDefinition = {
    id: "balanz",
    name: "Balanz",
    type: "BROKER",
    description: "Balanz - Broker de valores, acciones y bonos",
    authType: "api_key",
    supportedCurrencies: ["ARS", "USD"],
  };

  async getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]> {
    // TODO: GET /api/v1/portafolio
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async testConnection(credentials: Record<string, string>) {
    return { ok: false, message: "API no implementada aún" };
  }
}

export { IOLProvider, PPIProvider, BalanzProvider };
