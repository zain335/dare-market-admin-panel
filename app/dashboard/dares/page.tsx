import DareStatsCards from "@/components/dare-stats-cards";
import DareTable from "@/components/dare-table";

export default function Page() {
  return (
    <div className="h-page-screen flex items-start justify-center w-full">
      <div className="px-10 w-full">
        <div className="w-full py-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Dare Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Dares and players submission.{" "}
          </p>
        </div>
        <DareStatsCards />
        <DareTable />
      </div>
    </div>
  );
}
