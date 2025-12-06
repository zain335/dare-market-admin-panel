import { NextResponse } from "next/server";
import {
  cleanUpErrorMessage,
  sendErrorResponse,
} from "@/helpers";
import { DareStatsResponse } from "@/types";
import axios from "axios";
import jwt from "jsonwebtoken";
import {
  getCachedSolPrice,
  lamportsToSol,
  lamportsToUsd,
  formatSolAmount,
} from "@/utils/sol-price";

/**
 * GET endpoint to fetch dare statistics from backend API
 * Converts payouts to both SOL and USD (if CoinGecko price available)
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

    // Fetch stats from backend API
    const endpoint = `${baseUrl}/api/admin/dares/stats`;
    console.log("[Stats API] Fetching stats from:", endpoint);

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data?.success) {
      throw new Error(response.data?.error || "Failed to fetch stats from backend");
    }

    const backendStats = response.data.data;

    // Fetch SOL price (cached for 5 minutes)
    const solPrice = await getCachedSolPrice();

    // Convert lamports to SOL
    const totalPayoutSol = lamportsToSol(backendStats.totalPayoutLamports);
    const averagePayoutSol = lamportsToSol(backendStats.averagePayoutLamports);

    // Convert to USD if price is available
    const totalPayoutUsd = lamportsToUsd(backendStats.totalPayoutLamports, solPrice);
    const averagePayoutUsd = lamportsToUsd(backendStats.averagePayoutLamports, solPrice);

    // Build response with both SOL and USD values
    const statsResponse: DareStatsResponse = {
      success: true,
      data: {
        totalDares: backendStats.totalDares,
        activeDares: backendStats.activeDares,
        completedDares: backendStats.completedDares,
        unverifiedDares: backendStats.unverifiedDares,
        totalPayoutLamports: backendStats.totalPayoutLamports,
        totalPayoutSol: formatSolAmount(totalPayoutSol),
        totalPayoutUsd: totalPayoutUsd,
        averagePayoutLamports: backendStats.averagePayoutLamports,
        averagePayoutSol: formatSolAmount(averagePayoutSol),
        averagePayoutUsd: averagePayoutUsd,
      },
    };

    console.log("[Stats API] Successfully fetched and converted stats");
    if (solPrice) {
      console.log(`[Stats API] SOL Price: $${solPrice}`);
    } else {
      console.log("[Stats API] SOL price unavailable, returning SOL values only");
    }

    return NextResponse.json(statsResponse);
  } catch (error) {
    console.error("[Stats API] Error fetching stats:", error);
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
