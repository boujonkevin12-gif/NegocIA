export interface AccountSummary {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  previousBalance: number;
  previousIncome: number;
  previousExpenses: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: string;
  date: string;
  icon?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  symbol: string;
  value: number;
  buyPrice: number;
  change: number;
}

export interface SavingGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  icon: string;
  color: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: string;
  deadline: string;
  priority: "high" | "medium" | "low";
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

const now = new Date();
const dayAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const monthAgo = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, now.getDate()).toISOString();

export const mockAccountSummary: AccountSummary = {
  balance: 8_250_000,
  income: 1_000_000,
  expenses: 425_000,
  savings: 1_200_000,
  investments: 6_570_000,
  previousBalance: 7_330_000,
  previousIncome: 925_000,
  previousExpenses: 438_000,
};

export const mockMonthlyData: MonthlyData[] = [
  { month: "Ene", income: 880_000, expenses: 410_000, savings: 180_000 },
  { month: "Feb", income: 900_000, expenses: 395_000, savings: 200_000 },
  { month: "Mar", income: 850_000, expenses: 440_000, savings: 150_000 },
  { month: "Abr", income: 920_000, expenses: 405_000, savings: 210_000 },
  { month: "May", income: 950_000, expenses: 430_000, savings: 190_000 },
  { month: "Jun", income: 925_000, expenses: 438_000, savings: 175_000 },
  { month: "Jul", income: 1_000_000, expenses: 425_000, savings: 220_000 },
  { month: "Ago", income: 0, expenses: 0, savings: 0 },
  { month: "Sep", income: 0, expenses: 0, savings: 0 },
  { month: "Oct", income: 0, expenses: 0, savings: 0 },
  { month: "Nov", income: 0, expenses: 0, savings: 0 },
  { month: "Dic", income: 0, expenses: 0, savings: 0 },
];

export const mockTransactions: Transaction[] = [
  { id: "1", description: "Salario mensual", amount: 850_000, type: "INCOME", category: "Salario", date: dayAgo(1) },
  { id: "2", description: "Freelance diseño web", amount: 150_000, type: "INCOME", category: "Freelance", date: dayAgo(3) },
  { id: "3", description: "Alquiler departamento", amount: -180_000, type: "EXPENSE", category: "Vivienda", date: dayAgo(2) },
  { id: "4", description: "Supermercado", amount: -45_000, type: "EXPENSE", category: "Alimentos", date: dayAgo(4) },
  { id: "5", description: "Transferencia a ahorros", amount: -200_000, type: "TRANSFER", category: "Ahorros", date: dayAgo(5) },
  { id: "6", description: "Netflix + Spotify", amount: -8_500, type: "EXPENSE", category: "Entretenimiento", date: dayAgo(6) },
  { id: "7", description: "Gimnasio", amount: -15_000, type: "EXPENSE", category: "Salud", date: dayAgo(7) },
  { id: "8", description: "Venta MercadoLibre", amount: 35_000, type: "INCOME", category: "Venta", date: dayAgo(8) },
  { id: "9", description: "Gas + Luz", amount: -12_000, type: "EXPENSE", category: "Servicios", date: dayAgo(9) },
  { id: "10", description: "Café y almuerzo", amount: -9_200, type: "EXPENSE", category: "Alimentos", date: dayAgo(10) },
];

export const mockInvestments: Investment[] = [
  { id: "1", name: "YPF", type: "Stock", symbol: "YPF", value: 2_840_000, buyPrice: 2_500_000, change: 5.2 },
  { id: "2", name: "Bitcoin", type: "Crypto", symbol: "BTC", value: 1_938_000, buyPrice: 1_800_000, change: -2.1 },
  { id: "3", name: "Plazo Fijo UVA", type: "Plazo Fijo", symbol: "PF", value: 950_000, buyPrice: 900_000, change: 1.8 },
  { id: "4", name: "FCI Renta Fija", type: "Fondo", symbol: "FCI", value: 620_000, buyPrice: 600_000, change: 0.9 },
  { id: "5", name: "Galicia", type: "Stock", symbol: "GGAL", value: 224_000, buyPrice: 190_000, change: 3.4 },
];

export const mockSavingsGoals: SavingGoal[] = [
  { id: "1", name: "Fondo de emergencia", target: 3_000_000, current: 1_200_000, deadline: "2026-12-31", icon: "shield", color: "#3b82f6" },
  { id: "2", name: "Vacaciones Europa", target: 2_000_000, current: 680_000, deadline: "2027-06-01", icon: "plane", color: "#8b5cf6" },
  { id: "3", name: "Auto nuevo", target: 15_000_000, current: 2_400_000, deadline: "2028-01-01", icon: "car", color: "#f59e0b" },
];

export const mockFinancialGoals: FinancialGoal[] = [
  {
    id: "1",
    title: "Reducir gastos en 10%",
    description: "Bajar gastos hormiga y suscripciones innecesarias",
    progress: 65,
    target: "Gastos < $385.000/mes",
    deadline: "Ago 2026",
    priority: "high",
  },
  {
    id: "2",
    title: "Invertir 30% del ingreso",
    description: "Destinar 30% de cada sueldo a inversiones de largo plazo",
    progress: 42,
    target: "$300.000/mes",
    deadline: "Dic 2026",
    priority: "high",
  },
  {
    id: "3",
    title: "Crear second income",
    description: "Generar una fuente de ingreso adicional por freelancing",
    progress: 80,
    target: "$150.000/mes extra",
    deadline: "Sep 2026",
    priority: "medium",
  },
  {
    id: "4",
    title: "Armá tu emergency fund",
    description: "6 meses de gastos cubiertos en fondos líquidos",
    progress: 40,
    target: "$3.000.000",
    deadline: "Dic 2026",
    priority: "medium",
  },
  {
    id: "5",
    title: "Educación financiera",
    description: "Completar curso de inversiones y analisis técnico",
    progress: 25,
    target: "3 cursos completados",
    deadline: "Mar 2027",
    priority: "low",
  },
];

export const categoryBreakdown = [
  { name: "Vivienda", amount: 180_000, percentage: 42.4, color: "#3b82f6" },
  { name: "Ahorros", amount: 200_000, percentage: 29.4, color: "#22c55e" },
  { name: "Alimentos", amount: 54_200, percentage: 12.7, color: "#f59e0b" },
  { name: "Servicios", amount: 23_800, percentage: 5.6, color: "#06b6d4" },
  { name: "Entretenimiento", amount: 8_500, percentage: 2.0, color: "#8b5cf6" },
  { name: "Salud", amount: 15_000, percentage: 3.5, color: "#ef4444" },
  { name: "Otros", amount: 43_500, percentage: 4.4, color: "#71717a" },
];
