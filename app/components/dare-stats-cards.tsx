"use client";

import { Card, CardContent, CardHeader } from "@/components/shadcn/ui/card";
import axios from "axios";
import {
  Coins,
  Target,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Timer,
} from "lucide-react";
import { useEffect, useState } from "react";
import StatsCard from "./stats-card";
import { DareStatsData } from "@/types";

/**
 * Dare statistics cards component
 * Displays key metrics about dares in the system with USD conversion
 */
export default function DareStatsCards() {
  const [stats, setStats] = useState<DareStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const apiEndpoint = "/dare/stats";
      setLoading(true);
      try {
        const response = await axios.get(apiEndpoint);

        if (response.data?.success) {
          setStats(response.data.data);
        } else {
          console.error(
            "Failed to fetch Dare stats:",
            response.data?.message || "Unknown error"
          );
        }
      } catch (error) {
        console.error("Error fetching Dare stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  /**
   * Format payout to display USD if available, otherwise SOL
   * @param usdValue - Formatted USD string (e.g., "$12.8K USD") or null
   * @param solValue - Formatted SOL string (e.g., "12847.00")
   * @returns Display string with USD if available, otherwise SOL
   */
  const formatPayout = (usdValue: string | null, solValue: string): string => {
    if (usdValue) {
      return usdValue;
    }
    return `${solValue} SOL`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard
          title="Total Dares"
          value="--"
          icon={<Target className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Dares"
          value="--"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatsCard
          title="Completed Dares"
          value="--"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Payout"
          value="--"
          icon={<Coins className="h-4 w-4" />}
        />
        <StatsCard
          title="Unverified Dares"
          value="--"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <StatsCard
          title="Avg. Payout"
          value="--"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <StatsCard
        title="Total Dares"
        value={stats.totalDares}
        icon={<Target className="h-4 w-4" />}
      />
      <StatsCard
        title="Active Dares"
        value={stats.activeDares}
        icon={<Timer className="h-4 w-4" />}
      />
      <StatsCard
        title="Completed Dares"
        value={stats.completedDares}
        icon={<CheckCircle className="h-4 w-4" />}
      />
      <StatsCard
        title="Total Payout"
        value={formatPayout(stats.totalPayoutUsd, stats.totalPayoutSol)}
        icon={<Coins className="h-4 w-4" />}
      />
      <StatsCard
        title="Unverified Dares"
        value={stats.unverifiedDares}
        icon={<AlertCircle className="h-4 w-4" />}
      />
      <StatsCard
        title="Avg. Payout"
        value={formatPayout(stats.averagePayoutUsd, stats.averagePayoutSol)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
}
