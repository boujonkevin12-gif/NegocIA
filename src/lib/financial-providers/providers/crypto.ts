import type { FinancialProvider, FinancialProviderDefinition, NormalizedAccount, NormalizedTransaction, NormalizedInvestment } from "../types";

class BinanceProvider implements FinancialProvider {
  definition: FinancialProviderDefinition = {
    id: "binance",
    name: "Binance",
    type: "CRYPTO",
    description: "Binance - Exchange de criptomonedas",
    authType: "api_key",
    supportedCurrencies: ["ARS", "USD", "BTC", "ETH", "USDT"],
  };

  async getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]> {
    // TODO: Binance API — HMAC signed:
    //   GET /api/v3/account → balances
    //   Headers: X-MBX-APIKEY
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]> {
    // TODO: GET /api/v3/myTrades?symbol=BTCARS&startTime={since}
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]> {
    // TODO: GET /api/v3/account → non-zero balances como "inversiones"
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }> {
    throw new Error(`API de ${this.definition.name} no implementada aún.`);
  }

  async testConnection(credentials: Record<string, string>) {
    return { ok: false, message: "API no implementada aún" };
  }
}

export { BinanceProvider };
