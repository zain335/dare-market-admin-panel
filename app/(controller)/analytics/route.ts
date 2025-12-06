import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_GATEWAY || "http://localhost:4001";
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

/**
 * GET /analytics
 * Fetches analytics data from the backend
 * Query params:
 *   - endpoint: current | visitors | overview (default: overview)
 *   - days: number of days for historical data (default: 30)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const endpoint = searchParams.get("endpoint") || "overview";
        const days = searchParams.get("days") || "30";

        // Validate endpoint
        const validEndpoints = ["current", "visitors", "overview"];
        if (!validEndpoints.includes(endpoint)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid endpoint. Must be one of: ${validEndpoints.join(", ")}`,
                },
                { status: 400 }
            );
        }

        // Build URL with query params if needed
        const url =
            endpoint === "current"
                ? `${API_BASE_URL}/api/admin/analytics/current`
                : `${API_BASE_URL}/api/admin/analytics/${endpoint}?days=${days}`;

        // Fetch from backend
        const response = await axios.get(url, {
            headers: {
                "x-admin-secret": ADMIN_API_SECRET,
            },
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("[Analytics API] Error:", error);

        // Handle backend errors
        if (error.response) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.response.data?.error || "Backend error",
                },
                { status: error.response.status }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to fetch analytics",
            },
            { status: 500 }
        );
    }
}
