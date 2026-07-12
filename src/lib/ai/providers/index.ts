import { AI_CONFIG, type AIProviderName } from "../config";
import type { AIProvider } from "../types";
import { OpenAIProvider } from "./openai";

const providers: Partial<Record<AIProviderName, () => AIProvider>> = {
  openai: () => new OpenAIProvider(),
  // Para agregar un provider, implementá la interfaz AIProvider y registralo acá:
  // gemini: () => new GeminiProvider(),
  // claude: () => new ClaudeProvider(),
  // deepseek: () => new DeepseekProvider(),
};

export function getProvider(): AIProvider {
  const factory = providers[AI_CONFIG.provider];
  if (!factory) {
    throw new Error(`Provider desconocido: ${AI_CONFIG.provider}. Providers disponibles: ${Object.keys(providers).join(", ")}`);
  }
  return factory();
}
