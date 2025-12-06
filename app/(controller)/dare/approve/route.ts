import {
  cleanUpErrorMessage,
  getAuthHeader,
  sendErrorResponse,
} from "@/helpers";
import { MISSING_REQUEST_BODY } from "@/utils/errors";
import { 
  ApproveRejectRequestBody, 
  ModerateAPIRequestBody, 
  ModerateAPIResponse 
} from "@/types";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body: ApproveRejectRequestBody = await req.json();
    const { tokenMint, moderatorPublicKey, isApproved } = body;
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;
    
    // Validate required fields
    if (!tokenMint || !moderatorPublicKey || typeof isApproved !== "boolean") {
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

    // Prepare request body for backend API
    const requestBody: ModerateAPIRequestBody = {
      tokenMint,
      isApproved,
      moderatorPublicKey,
    };

    const response = await axios.post<ModerateAPIResponse>(
      `${baseUrl}/api/moderator/moderate`,
      requestBody,
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
