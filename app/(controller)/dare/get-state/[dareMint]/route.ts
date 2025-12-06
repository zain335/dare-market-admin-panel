import { NextResponse } from "next/server";
import { cleanUpErrorMessage, sendErrorResponse } from "@/helpers";
import { DareStateBackendResponse } from "@/types";
import axios from "axios";
import jwt from "jsonwebtoken";

/**
 * GET endpoint to fetch complete dare state from backend API
 * Returns comprehensive dare state including submissions, streams, and metadata
 *
 * @param dareMint - The dare's token mint address (route parameter)
 */
export async function GET(
  req: Request,
  { params }: { params: { dareMint: string } }
) {
  try {
    const { dareMint } = params;

    if (!dareMint) {
      throw new Error("dareMint parameter is required");
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

    // Fetch dare state from backend API
    const endpoint = `${baseUrl}/api/admin/dare/${dareMint}`;
    console.log("[Dare State API] Fetching dare state from:", endpoint);

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data?.success) {
      throw new Error(
        response.data?.error || "Failed to fetch dare state from backend"
      );
    }

    console.log(
      "[Dare State API] Successfully fetched dare state for:",
      dareMint
    );

    // Transform backend response to match DareStateBackendResponse type
    // Backend returns { success, data: { ...dareFields, submissions: [...] } }
    // We need to transform to { success, dareState: {...}, submissions: [...] }
    const backendData = response.data.data;
    const transformedResponse: DareStateBackendResponse = {
      success: true,
      dareState: {
        creator: backendData.creator,
        payoutAmount: backendData.payout,
        dareStatus: backendData.dareStatus,
        tradeStatus: backendData.tradeStatus,
        isTokenless: backendData.isTokenless,
        tokenProgram: backendData.tokenProgram,
        createdAt: backendData.createdAt || "",
        isBlocked: backendData.isBlocked,
        tokenMint: backendData.tokenMint,
        submitters: backendData.submitters,
        openTimestamp: String(backendData.openTimestamp),
        openDuration: String(backendData.openDuration),
        hasExpired: backendData.isExpired || false,
        availableSlots: backendData.submitters.filter((s: any) => s === null).length,
        submissions: backendData.submissions || [],
        dbDare: {
          ipfsCid: backendData.ipfsCid,
          hasActiveStream: backendData.hasActiveStream || false,
          streams: backendData.streams || [],
          attemptability: backendData.attemptability,
          isFeatured: backendData.isFeatured || false,
          isDisabled: backendData.isDisabled || false,
        },
      },
      submissions: backendData.submissions || [],
    };

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error("[Dare State API] Error fetching dare state:", error);
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
