import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data-server";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { AICenter } from "@/components/dashboard/ai-center";
import { Discoveries } from "@/components/dashboard/discoveries";
import { Goals } from "@/components/dashboard/goals";
import { Subscriptions } from "@/components/dashboard/subscriptions";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { AnalyzeButton } from "@/components/dashboard/analyze-button";

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
    investmentChange: 0,
    investmentValue: 0,
  };

  if (userId) {
    data = await getDashboardData(userId);
  }

  return (
    <div className="flex gap-8 pb-12">
      <div className="flex-1 space-y-10 min-w-0">
        <DashboardHero
          insights={data.discoveries}
          balance={data.balance}
          previousBalance={data.previousBalance}
          monthlyIncome={data.monthlyIncome}
          monthlyExpenses={data.monthlyExpenses}
        />

        <AnalyzeButton />

        <AICenter
          monthlyExpenses={data.monthlyExpenses}
          investmentChange={data.investmentChange}
          investmentValue={data.investmentValue}
          balance={data.balance}
        />

        <Discoveries discoveries={data.discoveries} />

        <div className="grid gap-8 lg:grid-cols-2">
          <Goals goals={data.goals} />
          <Subscriptions subscriptions={data.subscriptions} />
        </div>
      </div>

      <aside className="hidden xl:block w-72 shrink-0">
        <div className="sticky top-[calc(var(--header-height)+24px)]">
          <ActivityPanel />
        </div>
      </aside>
    </div>
  );
}
