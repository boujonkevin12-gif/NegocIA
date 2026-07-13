import { prisma } from "@/lib/prisma";
import { getLimitsForPlan, type PlanLimits, type PlanTier } from "@/lib/plans";

export interface PlanCheck {
  tier: PlanTier;
  limits: PlanLimits;
  canUse: boolean;
  reason?: string;
}

export async function getUserPlan(userId: string): Promise<{
  tier: PlanTier;
  limits: PlanLimits;
}> {
  const userPlan = await prisma.userPlan.findUnique({
    where: { userId },
  });

  if (!userPlan || userPlan.status === "CANCELLED") {
    return { tier: "FREE", limits: getLimitsForPlan("FREE") };
  }

  return {
    tier: userPlan.tier,
    limits: getLimitsForPlan(userPlan.tier),
  };
}

export async function canAddConnection(userId: string): Promise<PlanCheck> {
  const { tier, limits } = await getUserPlan(userId);

  const connectionCount = await prisma.providerConnection.count({
    where: { userId },
  });

  const canUse = connectionCount < limits.maxConnections;

  return {
    tier,
    limits,
    canUse,
    reason: canUse
      ? undefined
      : `Límite de ${limits.maxConnections} cuentas alcanzado. Mejorá a ${tier === "FREE" ? "Pro" : "Premium"}.`,
  };
}

export async function canSendAIMessage(userId: string): Promise<PlanCheck> {
  const { tier, limits } = await getUserPlan(userId);

  if (limits.aiMessagesPerDay === Infinity) {
    return { tier, limits, canUse: true };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const messageCount = await prisma.chatMessage.count({
    where: {
      conversation: { userId },
      role: "USER",
      createdAt: { gte: today },
    },
  });

  const canUse = messageCount < limits.aiMessagesPerDay;

  return {
    tier,
    limits,
    canUse,
    reason: canUse
      ? undefined
      : `Límite de ${limits.aiMessagesPerDay} mensajes IA/día alcanzado. Mejorá a ${tier === "FREE" ? "Pro" : "Premium"}.`,
  };
}

export async function canAddTransaction(userId: string): Promise<PlanCheck> {
  const { tier, limits } = await getUserPlan(userId);

  if (limits.maxTransactionsPerMonth === Infinity) {
    return { tier, limits, canUse: true };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactionCount = await prisma.transaction.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  });

  const canUse = transactionCount < limits.maxTransactionsPerMonth;

  return {
    tier,
    limits,
    canUse,
    reason: canUse
      ? undefined
      : `Límite de ${limits.maxTransactionsPerMonth} transacciones/mes alcanzado. Mejorá a ${tier === "FREE" ? "Pro" : "Premium"}.`,
  };
}
