export type AIProviderName = "openai" | "gemini" | "claude" | "deepseek";

export const AI_CONFIG = {
  provider: (process.env.AI_PROVIDER ?? "openai") as AIProviderName,
  models: {
    openai: "gpt-4o",
    gemini: "gemini-2.0-flash",
    claude: "claude-sonnet-4-20250514",
    deepseek: "deepseek-chat",
  },
  maxTokens: 1024,
  temperature: 0.7,
} as const;

export function getModelName(): string {
  return AI_CONFIG.models[AI_CONFIG.provider];
}
