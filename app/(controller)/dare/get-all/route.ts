import { cleanUpErrorMessage, sendErrorResponse } from "@/helpers";
import { NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import {
  DaresListResponse,
  DaresListParams,
  DareStatus,
  SubmissionStatus,
} from "@/types";

/**
 * GET endpoint to fetch dares from the backend API
 * Supports optional query parameters: status, creator, limit, cursor, submissionStatus
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Extract query parameters
    const status = url.searchParams.get("status") as DareStatus | null;
    const creator = url.searchParams.get("creator");
    const limitParam = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor");
    const submissionStatus = url.searchParams.get(
      "submissionStatus"
    ) as SubmissionStatus | null;

    // Validate status parameter if provided
    const validStatuses: DareStatus[] = [
      "open",
      "accepted",
      "completed",
      "unverified",
      "failed",
      "censored",
      "expired",
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate and parse limit parameter
    let limit: number | undefined;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        return NextResponse.json(
          {
            success: false,
            message: "Limit must be an integer between 1 and 1000",
          },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Validate creator parameter (basic Solana public key format check)
    if (creator && (creator.length < 32 || creator.length > 44)) {
      return NextResponse.json(
        {
          success: false,
          message: "Creator must be a valid Solana public key (base58 string)",
        },
        { status: 400 }
      );
    }

    // Validate submissionStatus parameter if provided
    const validSubmissionStatuses: SubmissionStatus[] = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "WINNER",
      "all",
    ];
    if (
      submissionStatus &&
      !validSubmissionStatuses.includes(submissionStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid submission status. Must be one of: ${validSubmissionStatuses.join(
            ", "
          )}`,
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

    // Prepare query parameters
    const params: DaresListParams = {};
    if (status) params.status = status;
    if (creator) params.creator = creator;
    if (limit) params.limit = limit;
    if (cursor) params.cursor = cursor;
    if (submissionStatus) params.submissionStatus = submissionStatus;
    // Always include disabled dares for admin panel listing
    params.includeDisabled = true;
    params.includeExpired = true;

    // Make API request to the backend with admin JWT token
    const response = await axios.get<DaresListResponse>(
      `${baseUrl}/api/admin/dares/list`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        params,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
