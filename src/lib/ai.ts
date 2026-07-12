export { buildFinancialContext } from "./ai/context";
export { getProvider } from "./ai/providers";
export { AI_CONFIG, getModelName } from "./ai/config";
export type { AIMessage, AIProvider } from "./ai/types";

import { buildFinancialContext } from "./ai/context";
import { getProvider } from "./ai/providers";

export interface ChatContext {
  messages: { role: string; content: string }[];
  userId: string;
}

export async function generateAIResponse(context: ChatContext): Promise<string> {
  const messages = await buildFinancialContext(context.userId, context.messages);
  return getProvider().chat(messages);
}

export async function generateAIResponseStream(
  context: ChatContext
): Promise<ReadableStream<Uint8Array>> {
  const messages = await buildFinancialContext(context.userId, context.messages);
  return getProvider().chatStream(messages);
}
