import {
  cleanUpErrorMessage,
  getAuthHeader,
  sendErrorResponse,
} from "@/helpers";
import { MISSING_REQUEST_BODY } from "@/utils/errors";
import { ModeratorInitRequestBody, ModeratorInitResponse } from "@/types";
import axios from "axios";
import { NextResponse } from "next/server";

/**
 * POST handler for moderator initialization
 * Accepts moderator public key and sends initialization request to backend
 */
export async function POST(req: Request) {
  try {
    const body: ModeratorInitRequestBody = await req.json();
    const { moderatorPublicKey } = body;
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;
    
    // Validate required fields
    if (!moderatorPublicKey) {
      throw new Error(MISSING_REQUEST_BODY);
    }

    // Get authorization header from session
    const authHeader = await getAuthHeader();
    if (!authHeader.Authorization) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No API token found" },
        { status: 401 }
      );
    }

    // Send initialization request to backend
    const response = await axios.post<ModeratorInitResponse>(
      `${baseUrl}/api/moderator/init`,
      {
        moderatorPublicKey: moderatorPublicKey,
      },
      {
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
