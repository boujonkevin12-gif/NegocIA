import type { FinancialProvider, ProviderType } from "./types";
import { GaliciaProvider, BrubankProvider, UaláProvider, MercadoPagoProvider } from "./providers/banks";
import { IOLProvider, PPIProvider, BalanzProvider } from "./providers/brokers";
import { BinanceProvider } from "./providers/crypto";

const registry: Record<string, () => FinancialProvider> = {
  galicia: () => new GaliciaProvider(),
  brubank: () => new BrubankProvider(),
  uala: () => new UaláProvider(),
  mercadopago: () => new MercadoPagoProvider(),
  iol: () => new IOLProvider(),
  ppi: () => new PPIProvider(),
  balanz: () => new BalanzProvider(),
  binance: () => new BinanceProvider(),
};

export function getFinancialProvider(providerId: string): FinancialProvider {
  const factory = registry[providerId];
  if (!factory) {
    throw new Error(
      `Provider financiero desconocido: "${providerId}". Disponibles: ${Object.keys(registry).join(", ")}`
    );
  }
  return factory();
}

export function listProviders(type?: ProviderType): Array<FinancialProvider["definition"]> {
  return Object.values(registry)
    .map((factory) => factory().definition)
    .filter((def) => !type || def.type === type);
}

export function registerProvider(provider: FinancialProvider): void {
  registry[provider.definition.id] = () => provider;
}
