// Dashboard statistics types

export interface DashboardOverview {
    // Dare counts
    totalDares: number;
    activeDares: number;
    completedDares: number;
    failedDares: number;
    openDares: number;
    unverifiedDares: number;

    // Submission counts
    totalSubmissions: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    winnerSubmissions: number;

    // Stream counts
    totalStreams: number;
    activeStreams: number;

    // Donation stats
    totalDonations: number;
    totalDonationLamports: string;
    totalDonationSol?: string;
    totalDonationUsd?: string | null;

    // Creator count
    totalCreators: number;

    // Payout stats
    totalPayoutLamports: string;
    totalPayoutSol?: string;
    totalPayoutUsd?: string | null;
    averagePayoutLamports: string;
    averagePayoutSol?: string;
    averagePayoutUsd?: string | null;
}

export interface TimeSeriesDataPoint {
    date: string;
    count: number;
}

export interface DashboardTimeSeries {
    dares: TimeSeriesDataPoint[];
    submissions: TimeSeriesDataPoint[];
    streams: TimeSeriesDataPoint[];
}

export interface StatusDistribution {
    status: string;
    count: number;
}

export interface TopCreator {
    creator: string;
    dareCount: number;
}

export interface PayoutRange {
    range: string;
    count: number;
}

export interface DashboardDistributions {
    dareStatus: StatusDistribution[];
    submissionStatus: StatusDistribution[];
    topCreators: TopCreator[];
    payoutRanges: PayoutRange[];
}

export interface DashboardStatsData {
    overview: DashboardOverview;
    timeSeries: DashboardTimeSeries;
    distributions: DashboardDistributions;
}

export interface DashboardStatsResponse {
    success: boolean;
    data: DashboardStatsData;
}
