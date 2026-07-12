import { auth } from "@/lib/auth";
import { getDashboardInsights } from "@/lib/dashboard-insights";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { BalanceOverview } from "@/components/dashboard/balance-overview";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { SavingsTracker } from "@/components/dashboard/savings-tracker";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { FinancialGoals } from "@/components/dashboard/financial-goals";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let insights: Awaited<ReturnType<typeof getDashboardInsights>> = [];
  if (userId) {
    insights = await getDashboardInsights(userId);
  }

  return (
    <div className="space-y-8">
      <DashboardHero insights={insights} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <BalanceOverview />
        </div>
        <div className="lg:col-span-8">
          <IncomeExpenseChart />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SavingsTracker />
        </div>
        <div className="lg:col-span-4">
          <InvestmentSummary />
        </div>
        <div className="lg:col-span-4">
          <FinancialGoals />
        </div>
      </div>

      <RecentTransactions />
    </div>
  );
}
