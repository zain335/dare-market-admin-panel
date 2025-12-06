"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, Eye, Clock, TrendingUp } from "lucide-react";
import { AnalyticsOverview } from "../types/analytics";

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  purple: "#8b5cf6",
};

export default function AnalyticsStats() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/analytics?endpoint=overview&days=30");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setAnalytics(result.data);
      setError(null);
    } catch (err: any) {
      console.error("[Analytics] Error fetching analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Visitor Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Visitor Analytics</h3>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-6">
            <div className="text-red-600">
              <p className="font-medium">Analytics Unavailable</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs mt-2 text-gray-600">
                Make sure GA4 is configured with property ID and service account credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { currentVisitors, stats, dailyVisitors } = analytics;

  // Format daily visitors data for chart
  const chartData = dailyVisitors.map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    visitors: day.visitors,
    pageViews: day.pageViews,
  }));

  // Calculate average session duration in minutes
  const avgSessionMinutes = Math.round(stats.averageSessionDuration / 60);

  return (
    <div className="space-y-6">
      {/* Overview Cards - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Visitors */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {currentVisitors.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Visitors (30 days) */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visitors (30d)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalVisitors.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Page Views */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views (30d)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pageViews.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Session Duration */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {avgSessionMinutes}m
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Details - Collapsible */}
      <details className="group">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-100 rounded-lg border border-gray-200 bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">Analytics Details</h3>
              <span className="text-xs text-gray-500">(Click to expand)</span>
            </div>
            <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
          </div>
        </summary>

        <div className="space-y-6 mt-4">
          {/* Visitor Trends Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Visitor Trends (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
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
                  />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    name="Visitors"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={{ fill: COLORS.success, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-medium">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bounce Rate</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats.bounceRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pages per Session</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats.pageViews / stats.totalVisitors).toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-medium">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Analytics data is sourced directly from Google Analytics 4</p>
                  <p className="text-xs">
                    Data refreshes every 5 minutes • Real-time data may have a 5-10 minute delay
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </details>
    </div>
  );
}
