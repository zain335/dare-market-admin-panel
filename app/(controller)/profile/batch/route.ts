import { NextResponse } from "next/server";
import { cleanUpErrorMessage, sendErrorResponse } from "@/helpers";
import { ProfileBatchRequest, ProfileBatchResponse } from "@/types";
import axios from "axios";
import jwt from "jsonwebtoken";

/**
 * POST endpoint to fetch profile information for multiple wallets in batch
 * Returns profile data including username, avatar, and other metadata
 *
 * @param req - Request with body: { wallets: string[] }
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body: ProfileBatchRequest = await req.json();

    if (!body.wallets || !Array.isArray(body.wallets)) {
      throw new Error("wallets array is required in request body");
    }

    if (body.wallets.length === 0) {
      // Return empty result for empty array
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (body.wallets.length > 1000) {
      throw new Error("Maximum 1000 wallets allowed per request");
    }

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

    // Call backend API
    const endpoint = `${baseUrl}/api/admin/profiles/batch`;
    console.log(
      `[Profile Batch API] Fetching ${body.wallets.length} profiles from:`,
      endpoint
    );

    const response = await axios.post<ProfileBatchResponse>(
      endpoint,
      { wallets: body.wallets },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.error || "Failed to fetch profiles from backend"
      );
    }

    console.log(
      `[Profile Batch API] Successfully fetched ${response.data.data.length} profiles`
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("[Profile Batch API] Error fetching profiles:", error);
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
