import { NextResponse } from "next/server";
import {
    cleanUpErrorMessage,
    sendErrorResponse,
} from "@/helpers";
import { DashboardStatsResponse } from "@/types/dashboard";
import axios from "axios";
import jwt from "jsonwebtoken";
import {
    getCachedSolPrice,
    lamportsToSol,
    lamportsToUsd,
    formatSolAmount,
} from "@/utils/sol-price";

/**
 * GET endpoint to fetch dashboard statistics from backend API
 * Converts lamports to both SOL and USD (if CoinGecko price available)
 */
export async function GET(req: Request) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;
        const adminApiSecret = process.env.ADMIN_API_SECRET;

        if (!baseUrl) {
            throw new Error("NEXT_PUBLIC_API_GATEWAY environment variable not set");
        }

        if (!adminApiSecret) {
            throw new Error("ADMIN_API_SECRET environment variable not set");
        }

        // Generate JWT token for admin authentication
        const adminToken = jwt.sign({ admin: true }, adminApiSecret, {
            expiresIn: "24h",
        });

        // Fetch dashboard stats from backend API
        const endpoint = `${baseUrl}/api/admin/dares/dashboard-stats`;
        console.log("[Dashboard Stats API] Fetching stats from:", endpoint);

        const response = await axios.get(endpoint, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.data?.success) {
            throw new Error(response.data?.error || "Failed to fetch dashboard stats from backend");
        }

        const backendStats = response.data.data;

        // Fetch SOL price (cached for 5 minutes)
        const solPrice = await getCachedSolPrice();

        // Convert lamports to SOL and USD for overview stats
        const overview = {
            ...backendStats.overview,
            // Donation conversions
            totalDonationSol: formatSolAmount(lamportsToSol(backendStats.overview.totalDonationLamports)),
            totalDonationUsd: lamportsToUsd(backendStats.overview.totalDonationLamports, solPrice),
            // Payout conversions
            totalPayoutSol: formatSolAmount(lamportsToSol(backendStats.overview.totalPayoutLamports)),
            totalPayoutUsd: lamportsToUsd(backendStats.overview.totalPayoutLamports, solPrice),
            averagePayoutSol: formatSolAmount(lamportsToSol(backendStats.overview.averagePayoutLamports)),
            averagePayoutUsd: lamportsToUsd(backendStats.overview.averagePayoutLamports, solPrice),
        };

        // Build response with converted values
        const statsResponse: DashboardStatsResponse = {
            success: true,
            data: {
                overview,
                timeSeries: backendStats.timeSeries,
                distributions: backendStats.distributions,
            },
        };

        console.log("[Dashboard Stats API] Successfully fetched and converted stats");
        if (solPrice) {
            console.log(`[Dashboard Stats API] SOL Price: $${solPrice}`);
        } else {
            console.log("[Dashboard Stats API] SOL price unavailable, returning SOL values only");
        }

        return NextResponse.json(statsResponse);
    } catch (error) {
        console.error("[Dashboard Stats API] Error fetching stats:", error);
        const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
        return sendErrorResponse(formattedErrorMsg);
    }
}

export const dynamic = "force-dynamic";
