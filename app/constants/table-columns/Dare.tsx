import { Button } from "@/components/shadcn/ui/button";
import TableActions from "@/components/table-actions";
import { TableAction, DareItem, ProfileData } from "@/types";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DareTitleCell } from "@/components/dare-title-cell";

interface DareTableColumnsProps {
  actions: (rowData: DareItem) => TableAction[];
  profiles?: Map<string, ProfileData>;
  profilesLoading?: boolean;
}

/**
 * Table columns configuration for Dare data
 * Displays dare information including token mint, creator, status, payout, etc.
 */
export const DareTableColumns = ({
  actions,
  profiles,
  profilesLoading = false,
}: DareTableColumnsProps): ColumnDef<DareItem>[] => {
  return [
    {
      accessorKey: "tokenMint",
      header: "Title",
      cell: ({ row }) => {
        const dare = row.original;
        const tokenMint = row.getValue("tokenMint") as string;
        const ipfsCid = dare.ipfsCid || "";

        return <DareTitleCell ipfsCid={ipfsCid} tokenMint={tokenMint} />;
      },
    },
    {
      accessorKey: "creator",
      header: "Creator",
      cell: ({ row }) => {
        const creator = row.getValue("creator") as string;
        const profile = profiles?.get(creator);

        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {profile?.username ? (
                <div className="flex flex-col">
                  <span className="font-medium text-xs truncate">
                    {profile.username}
                  </span>
                  <span className="font-mono text-xs text-gray-400">
                    {creator.slice(0, 4)}...{creator.slice(-4)}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-xs">
                  {creator.slice(0, 8)}...{creator.slice(-8)}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "dareStatus",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Dare Status
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("dareStatus") as string;
        const statusColor =
          {
            open: "text-blue-600 bg-blue-100",
            accepted: "text-yellow-600 bg-yellow-100",
            completed: "text-green-600 bg-green-100",
            unverified: "text-gray-600 bg-gray-100",
          }[status] || "text-gray-600 bg-gray-100";

        return (
          <div
            className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          >
            {status}
          </div>
        );
      },
    },
    {
      accessorKey: "tradeStatus",
      header: "Trade Status",
      cell: ({ row }) => {
        const status = row.getValue("tradeStatus") as string;
        const statusColor =
          status === "open"
            ? "text-green-600 bg-green-100"
            : "text-red-600 bg-red-100";

        return (
          <div
            className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          >
            {status}
          </div>
        );
      },
    },
    {
      accessorKey: "payout",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payout
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const payout = row.getValue("payout") as string;
        // Convert from smallest unit (assuming 9 decimals for SOL)
        const payoutInSol = (parseFloat(payout) / 1_000_000_000).toFixed(4);
        return <div className="font-medium">{payoutInSol} SOL</div>;
      },
    },
    {
      accessorKey: "openTimestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Open Time
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const timestamp = row.getValue("openTimestamp") as number;
        if (timestamp === 0) {
          return <div className="text-gray-500">Not opened</div>;
        }
        return (
          <div className="text-xs">
            {format(new Date(timestamp * 1000), "dd-MM-yyyy HH:mm")}
          </div>
        );
      },
    },
    {
      accessorKey: "openDuration",
      header: "Duration",
      cell: ({ row }) => {
        const duration = row.getValue("openDuration") as number;
        const hours = Math.floor(duration / 3600);
        const days = Math.floor(hours / 24);

        if (days > 0) {
          return (
            <div className="text-xs">
              {days}d {hours % 24}h
            </div>
          );
        }
        return <div className="text-xs">{hours}h</div>;
      },
    },
    {
      accessorKey: "isBlocked",
      header: "Blocked",
      cell: ({ row }) => {
        const isBlocked = row.getValue("isBlocked") as boolean;
        return (
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isBlocked
                ? "text-red-600 bg-red-100"
                : "text-green-600 bg-green-100"
            }`}
          >
            {isBlocked ? "Yes" : "No"}
          </div>
        );
      },
    },
    {
      accessorKey: "submitters",
      header: "Submitters",
      cell: ({ row }) => {
        const submitters = row.getValue("submitters") as (string | null)[];
        const activeSubmitters = submitters.filter((s) => s !== null).length;
        return (
          <div className="text-xs">
            {activeSubmitters}/{submitters.length}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const rowData = row.original;
        return <TableActions actions={actions(rowData)} />;
      },
    },
  ];
};
