import {
  cleanUpErrorMessage,
  sendErrorResponse,
} from "@/helpers";
import { MISSING_REQUEST_BODY } from "@/utils/errors";
import { ToggleFeaturedRequest, ToggleFeaturedResponse } from "@/types";
import axios from "axios";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * POST handler for toggling dare featured status
 * Accepts featured toggle request and forwards to backend API
 * Backend endpoint: POST /api/featured/:dareMint
 */
export async function POST(req: Request) {
  try {
    const body: ToggleFeaturedRequest = await req.json();
    const { tokenMint, isFeatured } = body;
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;

    // Validate required fields
    if (!tokenMint || typeof isFeatured !== "boolean") {
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

    // Prepare request body for backend API (only isFeatured)
    const requestBody = {
      isFeatured,
    };

    // Call backend API to toggle featured status
    // Endpoint: POST /api/dares/featured/:dareMint
    const endpoint = `${baseUrl}/api/dares/featured/${tokenMint}`;
    console.log({ endpoint, requestBody });

    const response = await axios.post<ToggleFeaturedResponse>(
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
    console.log(error);
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
