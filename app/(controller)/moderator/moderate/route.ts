import {
  cleanUpErrorMessage,
  sendErrorResponse,
} from "@/helpers";
import { MISSING_REQUEST_BODY } from "@/utils/errors";
import { ApproveRejectRequestBody, ModerateAPIResponse } from "@/types";
import axios from "axios";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * POST handler for moderating dares (approve/reject)
 * Accepts moderation request and forwards to backend API
 */
export async function POST(req: Request) {
  try {
    const body: ApproveRejectRequestBody = await req.json();
    const { tokenMint, moderatorPublicKey, isApproved } = body;
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;

    // Validate required fields
    if (!tokenMint || !moderatorPublicKey || typeof isApproved !== "boolean") {
      throw new Error(MISSING_REQUEST_BODY);
    }

    // Get admin API secret from environment variables
    const adminApiSecret = process.env.ADMIN_API_SECRET;
    if (!adminApiSecret) {
      return NextResponse.json(
        { success: false, message: "Admin API secret not configured" },
        { status: 500 }
      );
    }

    // Generate JWT token for admin authentication
    const adminToken = jwt.sign({ admin: true }, adminApiSecret, {
      expiresIn: "24h",
    });

    // Prepare request body for backend API
    const requestBody = {
      tokenMint,
      isApproved,
      moderatorPublicKey,
    };

    // Call backend API to get moderation transaction
    const response = await axios.post<ModerateAPIResponse>(
      `${baseUrl}/api/moderator/moderate`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.log(error)
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
