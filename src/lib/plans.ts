import type { $Enums } from "@/generated/prisma/client";
export type PlanTier = $Enums.PlanTier;

export interface PlanLimits {
  maxConnections: number;
  maxTransactionsPerMonth: number;
  aiMessagesPerDay: number;
  advisors: string[];
  reports: boolean;
  prioritySupport: boolean;
  exportData: boolean;
}

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  description: string;
  price: number; // ARS
  priceLabel: string;
  period: "monthly" | "yearly";
  features: string[];
  limits: PlanLimits;
  mercadopagoPreferId?: string;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    name: "Gratis",
    description: "Para empezar a organizar tus finanzas",
    price: 0,
    priceLabel: "$0",
    period: "monthly",
    features: [
      "1 cuenta bancaria",
      "10 transacciones/mes",
      "5 mensajes IA/día",
      "1 asesor financiero",
    ],
    limits: {
      maxConnections: 1,
      maxTransactionsPerMonth: 10,
      aiMessagesPerDay: 5,
      advisors: ["finance"],
      reports: false,
      prioritySupport: false,
      exportData: false,
    },
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    description: "Para controlar tus finanzas como un profesional",
    price: 9990,
    priceLabel: "$9.990",
    period: "monthly",
    features: [
      "5 cuentas bancarias",
      "Transacciones ilimitadas",
      "50 mensajes IA/día",
      "Todos los asesores",
      "Reportes mensuales",
      "Exportar datos",
    ],
    limits: {
      maxConnections: 5,
      maxTransactionsPerMonth: Infinity,
      aiMessagesPerDay: 50,
      advisors: ["finance", "investments", "marketing", "business", "legal", "accounting"],
      reports: true,
      prioritySupport: false,
      exportData: true,
    },
  },
  PREMIUM: {
    tier: "PREMIUM",
    name: "Premium",
    description: "Para emprendedores y negocios serios",
    price: 24990,
    priceLabel: "$24.990",
    period: "monthly",
    features: [
      "Cuentas ilimitadas",
      "Transacciones ilimitadas",
      "Mensajes IA ilimitados",
      "Todos los asesores + personalizados",
      "Reportes avanzados",
      "Exportar datos",
      "Soporte prioritario",
      "Análisis de negocio",
    ],
    limits: {
      maxConnections: Infinity,
      maxTransactionsPerMonth: Infinity,
      aiMessagesPerDay: Infinity,
      advisors: ["finance", "investments", "marketing", "business", "legal", "accounting"],
      reports: true,
      prioritySupport: true,
      exportData: true,
    },
  },
};

export function getPlan(tier: PlanTier): PlanDefinition {
  return PLANS[tier];
}

export function getLimitsForPlan(tier: PlanTier): PlanLimits {
  return PLANS[tier].limits;
}

export function getNextTier(current: PlanTier): PlanTier | null {
  if (current === "FREE") return "PRO";
  if (current === "PRO") return "PREMIUM";
  return null;
}
