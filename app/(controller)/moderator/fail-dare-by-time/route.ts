import {
  cleanUpErrorMessage,
  sendErrorResponse,
} from "@/helpers";
import { MISSING_REQUEST_BODY } from "@/utils/errors";
import { FailDareByTimeRequest, FailDareByTimeResponse } from "@/types";
import axios from "axios";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * POST handler for failing an expired dare
 * Handles both tokenized and tokenless dares in a single endpoint
 * Backend endpoint: POST /api/moderator/fail-dare-by-time
 */
export async function POST(req: Request) {
  try {
    const body: FailDareByTimeRequest = await req.json();
    const { moderatorPublicKey, tokenMint, dareStatePublicKey } = body;
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;

    // Validate required fields
    if (!moderatorPublicKey) {
      throw new Error("moderatorPublicKey is required");
    }

    // Validate that exactly ONE of tokenMint or dareStatePublicKey is provided
    const hasTokenMint = Boolean(tokenMint);
    const hasDareState = Boolean(dareStatePublicKey);

    if (!hasTokenMint && !hasDareState) {
      throw new Error(
        "Must provide exactly one of: tokenMint or dareStatePublicKey"
      );
    }

    if (hasTokenMint && hasDareState) {
      throw new Error(
        "Must provide exactly one of: tokenMint or dareStatePublicKey (not both)"
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

    // Prepare request body for backend API
    const requestBody: FailDareByTimeRequest = {
      moderatorPublicKey,
      ...(tokenMint && { tokenMint }),
      ...(dareStatePublicKey && { dareStatePublicKey }),
    };

    // Call backend API to get fail dare transaction
    const endpoint = `${baseUrl}/api/moderator/fail-dare-by-time`;
    console.log({ endpoint, requestBody });

    const response = await axios.post<FailDareByTimeResponse>(
      endpoint,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log({ response: response.data });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error in fail-dare-by-time route:", error);
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
