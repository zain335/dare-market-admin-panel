"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  DashboardTimeSeries,
  DashboardDistributions,
} from "@/types/dashboard";
import { useProfiles } from "@/hooks/use-profiles";

/**
 * Dashboard charts component
 * Displays various visualizations of platform metrics
 */
export default function DashboardCharts() {
  const [timeSeries, setTimeSeries] = useState<DashboardTimeSeries | null>(null);
  const [distributions, setDistributions] = useState<DashboardDistributions | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract creator wallets early (before any returns) with safe default
  const creatorWallets = useMemo(() => {
    return distributions?.topCreators?.map((c) => c.creator) || [];
  }, [distributions?.topCreators]);

  // Fetch profiles for top creators - hook must be called unconditionally
  const { profiles } = useProfiles(creatorWallets);

  useEffect(() => {
    const fetchStats = async () => {
      const apiEndpoint = "/dashboard/stats";
      setLoading(true);
      try {
        const response = await axios.get(apiEndpoint);

        if (response.data?.success) {
          setTimeSeries(response.data.data.timeSeries);
          setDistributions(response.data.data.distributions);
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

  // Color palettes
  const COLORS = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    pink: "#ec4899",
    teal: "#14b8a6",
    indigo: "#6366f1",
  };

  const STATUS_COLORS: { [key: string]: string } = {
    open: COLORS.primary,
    accepted: COLORS.warning,
    completed: COLORS.success,
    failed: COLORS.danger,
    unverified: "#9ca3af",
    censored: "#4b5563",
    PENDING: COLORS.warning,
    APPROVED: COLORS.success,
    REJECTED: COLORS.danger,
    WINNER: COLORS.purple,
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!timeSeries || !distributions) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load dashboard charts
      </div>
    );
  }

  // Format dates for better display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Prepare time-series data
  const daresData = timeSeries.dares.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }));

  const submissionsData = timeSeries.submissions.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }));

  const streamsData = timeSeries.streams.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }));

  // Combine all time-series data into a single dataset for the merged chart
  const combinedData = daresData.map((dare, index) => ({
    date: dare.date,
    dares: dare.count,
    submissions: submissionsData[index]?.count || 0,
    streams: streamsData[index]?.count || 0,
  }));

  // Prepare distribution data
  const dareStatusData = distributions.dareStatus.map((d) => ({
    name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    value: d.count,
    color: STATUS_COLORS[d.status] || COLORS.primary,
  }));

  const submissionStatusData = distributions.submissionStatus.map((d) => ({
    name: d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || COLORS.primary,
  }));

  // Prepare top creators data with usernames when available
  const topCreatorsData = distributions.topCreators.map((c) => {
    const profile = profiles.get(c.creator);
    const displayName = profile?.username 
      ? `@${profile.username}`
      : `${c.creator.substring(0, 8)}...`;
    
    return {
      creator: displayName,
      fullCreator: c.creator,
      username: profile?.username,
      dares: c.dareCount,
    };
  });

  const payoutRangesData = distributions.payoutRanges;

  return (
    <div className="space-y-6">
      {/* Activity & Top Creators - Single Row */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Activity Overview</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Combined Activity Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Platform Activity (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="line"
                    formatter={(value) => {
                      const labels: { [key: string]: string } = {
                        dares: "Dares Created",
                        submissions: "Submissions",
                        streams: "Live Streams Created",
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dares"
                    name="dares"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    name="submissions"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={{ fill: COLORS.success, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="streams"
                    name="streams"
                    stroke={COLORS.purple}
                    strokeWidth={2}
                    dot={{ fill: COLORS.purple, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Creators */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Top 10 Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topCreatorsData} layout="vertical" margin={{ left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12 }} 
                    stroke="#6b7280"
                    label={{ value: "Number of Dares", position: "insideBottom", offset: 0, fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="creator"
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                    formatter={(value: any, name: any, props: any) => {
                      const username = props.payload.username;
                      const wallet = props.payload.fullCreator;
                      const label = username 
                        ? `@${username} (${wallet.substring(0, 4)}...${wallet.substring(wallet.length - 4)})`
                        : wallet;
                      return [value + " dares", label];
                    }}
                  />
                  <Bar dataKey="dares" fill={COLORS.indigo} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Distribution Charts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Distributions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dare Status Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Dare Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dareStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dareStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Submission Status Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Submission Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={submissionStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {submissionStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
