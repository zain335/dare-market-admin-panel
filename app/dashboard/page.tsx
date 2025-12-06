import DashboardStatsCards from "@/components/dashboard-stats-cards";
import DashboardCharts from "@/components/dashboard-charts";
import AnalyticsStats from "@/components/analytics-stats";

export default function Page() {
  return (
    <div className="h-page-screen flex items-start justify-center w-full overflow-y-auto">
      <div className="px-10 w-full">
        <div className="w-full py-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform overview and statistics
          </p>
        </div>

        {/* Analytics */}
        <AnalyticsStats />


        {/* Stats Cards */}
        <DashboardStatsCards />



        {/* Charts */}
        <div className="mt-8">
          <DashboardCharts />
        </div>
      </div>
    </div>
  );
}
