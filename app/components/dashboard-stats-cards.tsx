"use client";

import { Card, CardContent, CardHeader } from "@/components/shadcn/ui/card";
import axios from "axios";
import {
  Target,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  FileX,
  Trophy,
  Video,
  PlayCircle,
  DollarSign,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import StatsCard from "./stats-card";
import { DashboardOverview } from "@/types/dashboard";

/**
 * Dashboard statistics cards component
 * Displays comprehensive metrics about the platform
 */
export default function DashboardStatsCards() {
  const [stats, setStats] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const apiEndpoint = "/dashboard/stats";
      setLoading(true);
      try {
        const response = await axios.get(apiEndpoint);

        if (response.data?.success) {
          setStats(response.data.data.overview);
        } else {
          console.error(
            "Failed to fetch Dashboard stats:",
            response.data?.message || "Unknown error"
          );
        }
      } catch (error) {
        console.error("Error fetching Dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  /**
   * Format payout to display USD if available, otherwise SOL
   */
  const formatPayout = (usdValue: string | null | undefined, solValue: string | undefined): string => {
    if (usdValue) {
      return usdValue;
    }
    return solValue ? `${solValue} SOL` : "0 SOL";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load dashboard statistics
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Core Metrics - Most Important */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Dares"
          value={stats.totalDares}
          icon={<Target className="h-4 w-4" />}
          compact
        />
        <StatsCard
          title="Active Dares"
          value={stats.activeDares}
          icon={<PlayCircle className="h-4 w-4" />}
          compact
        />
        <StatsCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={<FileCheck className="h-4 w-4" />}
          compact
        />
        <StatsCard
          title="Total Creators"
          value={stats.totalCreators}
          icon={<Users className="h-4 w-4" />}
          compact
        />
      </div>

      {/* Detailed Metrics - Collapsible */}
      <details className="group">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-100 rounded-lg border border-gray-200 bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">Detailed Statistics</h3>
              <span className="text-xs text-gray-500">(Click to expand)</span>
            </div>
            <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
          </div>
        </summary>
        
        <div className="space-y-4 mt-2">
          {/* Dare Details */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 px-1">Dare Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatsCard
                title="Open"
                value={stats.openDares}
                icon={<Clock className="h-3 w-3" />}
                compact
                small
              />
              <StatsCard
                title="Completed"
                value={stats.completedDares}
                icon={<CheckCircle className="h-3 w-3" />}
                compact
                small
              />
              <StatsCard
                title="Failed"
                value={stats.failedDares}
                icon={<XCircle className="h-3 w-3" />}
                compact
                small
              />
              <StatsCard
                title="Unverified"
                value={stats.unverifiedDares}
                icon={<AlertCircle className="h-3 w-3" />}
                compact
                small
              />
            </div>
          </div>

          {/* Submission Details */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 px-1">Submission Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
              <StatsCard
                title="Pending"
                value={stats.pendingSubmissions}
                icon={<Clock className="h-3 w-3" />}
                compact
                small
              />
              <StatsCard
                title="Approved"
                value={stats.approvedSubmissions}
                icon={<CheckCircle className="h-3 w-3" />}
                compact
                small
              />
              <StatsCard
                title="Rejected"
                value={stats.rejectedSubmissions}
                icon={<FileX className="h-3 w-3" />}
                compact
                small
              />
              <StatsCard
                title="Winners"
                value={stats.winnerSubmissions}
                icon={<Trophy className="h-3 w-3" />}
                compact
                small
              />
            </div>
          </div>

          {/* Platform Metrics */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 px-1">Platform Metrics</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatsCard
                title="Total Streams"
                value={stats.totalStreams}
                icon={<Video className="h-3 w-3" />}
                compact
                small
              />
              <StatsCard
                title="Active Streams"
                value={stats.activeStreams}
                icon={<PlayCircle className="h-3 w-3" />}
                compact
                small
              />
              <StatsCard
                title="Donations"
                value={formatPayout(stats.totalDonationUsd, stats.totalDonationSol)}
                icon={<DollarSign className="h-3 w-3" />}
                compact
                small
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
