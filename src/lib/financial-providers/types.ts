export interface NormalizedAccount {
  externalId: string;
  name: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "DEBIT_CARD" | "WALLET" | "OTHER";
  currency: string;
  balance: number;
  availableBalance?: number;
}

export interface NormalizedTransaction {
  externalId: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: string;
  description: string;
  date: Date;
  counterparty?: string;
}

export interface NormalizedInvestment {
  externalId: string;
  name: string;
  type: "STOCK" | "CRYPTO" | "BOND" | "FIXED_TERM" | "MUTUAL_FUND" | "OTHER";
  symbol?: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currency: string;
}

export interface SyncResult {
  accounts: NormalizedAccount[];
  transactions: NormalizedTransaction[];
  investments: NormalizedInvestment[];
}

export type ProviderType = "BANK" | "BROKER" | "CRYPTO";

export interface FinancialProviderDefinition {
  id: string;
  name: string;
  type: ProviderType;
  description: string;
  logoUrl?: string;
  authType: "credentials" | "oauth" | "api_key";
  supportedCurrencies: string[];
}

export interface FinancialProvider {
  definition: FinancialProviderDefinition;

  getAccounts(credentials: Record<string, string>): Promise<NormalizedAccount[]>;
  getTransactions(credentials: Record<string, string>, since?: Date): Promise<NormalizedTransaction[]>;
  getInvestments(credentials: Record<string, string>): Promise<NormalizedInvestment[]>;
  getBalance(credentials: Record<string, string>): Promise<{ total: number; currency: string }>;

  testConnection(credentials: Record<string, string>): Promise<{ ok: boolean; message?: string }>;
}
