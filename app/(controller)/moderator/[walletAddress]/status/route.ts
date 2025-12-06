import {
  cleanUpErrorMessage,
  getAuthHeader,
  sendErrorResponse,
} from "@/helpers";
import { ModeratorStatusResponse } from "@/types";
import axios from "axios";
import { NextResponse } from "next/server";

/**
 * GET handler for checking moderator initialization status
 * Accepts wallet address as path parameter and checks status via backend
 */
export async function GET(
  req: Request,
  { params }: { params: { walletAddress: string } }
) {
  const { walletAddress } = params;
  const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;

  try {
    // Validate wallet address parameter
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Call backend API to check moderator status (no authorization required)
    const response = await axios.get<ModeratorStatusResponse>(
      `${baseUrl}/api/moderator/${walletAddress}/status`
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    // Handle 404 as "moderator not initialized" rather than an error
    if (error.response?.status === 404) {
      return NextResponse.json(error.response.data);
    }

    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
