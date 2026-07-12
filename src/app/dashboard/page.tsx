import { DashboardGreeting } from "@/components/dashboard/greeting";
import { BalanceOverview } from "@/components/dashboard/balance-overview";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { SavingsTracker } from "@/components/dashboard/savings-tracker";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { FinancialGoals } from "@/components/dashboard/financial-goals";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardGreeting />

      <QuickActions />

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
