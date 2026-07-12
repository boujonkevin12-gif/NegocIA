import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAIResponseStream } from "@/lib/ai";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { conversationId, content } = await request.json();

  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: "conversationId y content son requeridos" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
  }

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "USER",
      content: content.trim(),
    },
  });

  const history = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  const messagesForAI = history.map((m) => ({
    role: m.role === "USER" ? "user" as const : m.role === "ASSISTANT" ? "assistant" as const : "system" as const,
    content: m.content,
  }));

  const stream = await generateAIResponseStream({
    messages: messagesForAI,
    userId: session.user.id,
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullResponse += decoder.decode(value, { stream: true });
  }

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: fullResponse,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  if (history.length <= 1) {
    const title = content.trim().slice(0, 60) + (content.trim().length > 60 ? "..." : "");
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  return NextResponse.json({
    role: "ASSISTANT",
    content: fullResponse,
  });
}
