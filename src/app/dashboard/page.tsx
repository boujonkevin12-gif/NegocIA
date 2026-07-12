import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data-server";
import { FinancialAnalysis } from "@/components/dashboard/financial-analysis";
import { AICenter } from "@/components/dashboard/ai-center";
import { Discoveries } from "@/components/dashboard/discoveries";
import { Goals } from "@/components/dashboard/goals";
import { Subscriptions } from "@/components/dashboard/subscriptions";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let data = {
    balance: 0,
    previousBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    balanceInsight: "Conectá tu primer cuenta bancaria para ver tu análisis financiero.",
    discoveries: [] as Awaited<ReturnType<typeof getDashboardData>>["discoveries"],
    goals: [] as Awaited<ReturnType<typeof getDashboardData>>["goals"],
    subscriptions: [] as Awaited<ReturnType<typeof getDashboardData>>["subscriptions"],
  };

  if (userId) {
    data = await getDashboardData(userId);
  }

  return (
    <div className="space-y-10 pb-12">
      <FinancialAnalysis
        balance={data.balance}
        previousBalance={data.previousBalance}
        monthlyIncome={data.monthlyIncome}
        monthlyExpenses={data.monthlyExpenses}
        insight={data.balanceInsight}
      />

      <AICenter />

      <Discoveries discoveries={data.discoveries} />

      <div className="grid gap-8 lg:grid-cols-2">
        <Goals goals={data.goals} />
        <Subscriptions subscriptions={data.subscriptions} />
      </div>
    </div>
  );
}
