export interface VisitorStats {
    totalVisitors: number;
    pageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
}

export interface DailyVisitorData {
    date: string;
    visitors: number;
    pageViews: number;
}

export interface AnalyticsOverview {
    currentVisitors: number;
    stats: VisitorStats;
    dailyVisitors: DailyVisitorData[];
}

export interface AnalyticsResponse {
    success: boolean;
    data?: any;
    error?: string;
}
