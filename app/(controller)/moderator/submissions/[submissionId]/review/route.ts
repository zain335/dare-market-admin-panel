import {
  cleanUpErrorMessage,
  sendErrorResponse,
} from "@/helpers";
import { NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import {
  SubmissionReviewRequest,
  SubmissionReviewResponse,
  SubmissionReviewAction,
} from "@/types";

/**
 * POST endpoint to review a dare submission (approve or reject)
 * @param req - Request object
 * @param params - Route parameters containing submissionId
 */
export async function POST(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { submissionId } = params;

    // Validate submissionId format (basic UUID validation)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(submissionId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid submission ID format",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body: SubmissionReviewRequest = await req.json();
    const { moderatorWallet, action, notes } = body;

    // Validate required fields
    if (!moderatorWallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Moderator wallet address is required",
        },
        { status: 400 }
      );
    }

    // Validate moderator wallet format
    if (moderatorWallet.length < 32 || moderatorWallet.length > 44) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Moderator wallet must be a valid Solana public key (base58 string)",
        },
        { status: 400 }
      );
    }

    // Validate action
    const validActions: SubmissionReviewAction[] = [
      "APPROVE",
      "REJECT",
      "SELECT_WINNER",
    ];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid action. Must be one of: ${validActions.join(", ")}`,
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
    const requestBody: SubmissionReviewRequest = {
      moderatorWallet,
      action,
      notes,
    };

    // Make API request to the backend
    const response = await axios.post<SubmissionReviewResponse>(
      `${baseUrl}/api/moderator/submissions/${submissionId}/review`,
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
    console.error(error);
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
