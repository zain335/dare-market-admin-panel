import {
  cleanUpErrorMessage,
  sendErrorResponse,
} from "@/helpers";
import { NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import { CompleteDareRequest, CompleteDareResponse } from "@/types";

/**
 * POST endpoint to complete a dare (mark as completed or failed)
 * When successful, automatically triggers next-level voting session creation
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body: CompleteDareRequest = await req.json();
    const { tokenMint, isSuccessful, moderatorPublicKey } = body;

    // Validate required fields
    if (!tokenMint) {
      return NextResponse.json(
        {
          success: false,
          message: "Token mint address is required",
        },
        { status: 400 }
      );
    }

    // Validate tokenMint format (basic Solana public key check)
    if (tokenMint.length < 32 || tokenMint.length > 44) {
      return NextResponse.json(
        {
          success: false,
          message: "Token mint must be a valid Solana public key (base58 string)",
        },
        { status: 400 }
      );
    }

    // Validate moderatorPublicKey if provided
    if (
      moderatorPublicKey &&
      (moderatorPublicKey.length < 32 || moderatorPublicKey.length > 44)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Moderator public key must be a valid Solana public key (base58 string)",
        },
        { status: 400 }
      );
    }

    // Get base URL from environment variables
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: "API Gateway URL not configured" },
        { status: 500 }
      );
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

    // Prepare request body
    const requestBody: CompleteDareRequest = {
      tokenMint,
      isSuccessful: isSuccessful !== undefined ? isSuccessful : true,
      moderatorPublicKey,
    };

    // Make API request to the backend
    const response = await axios.post<CompleteDareResponse>(
      `${baseUrl}/api/moderator/complete-dare`,
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
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
