import OpenAI from "openai";
import { AI_CONFIG, getModelName } from "../config";
import type { AIMessage, AIProvider } from "../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIProvider implements AIProvider {
  async chat(messages: AIMessage[]): Promise<string> {
    const response = await client.chat.completions.create({
      model: getModelName(),
      messages,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    });

    return response.choices[0]?.message?.content ?? "No se pudo generar una respuesta.";
  }

  async chatStream(messages: AIMessage[]): Promise<ReadableStream<Uint8Array>> {
    const response = await client.chat.completions.create({
      model: getModelName(),
      messages,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stream: true,
    });

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}
