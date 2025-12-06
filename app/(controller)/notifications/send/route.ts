import { NextResponse } from "next/server";
import {
  cleanUpErrorMessage,
  getAuthHeader,
  sendErrorResponse,
} from "@/helpers";
import { SendNotificationRequest, SendNotificationResponse } from "@/types";
import axios from "axios";
import jwt from "jsonwebtoken";

/**
 * POST endpoint for sending notifications to users
 * Forwards notification requests to backend API with admin authentication
 *
 * Backend endpoint: POST /api/notifications
 * Body: { wallet, type, dareMint?, remarks? }
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body: SendNotificationRequest = await req.json();
    const { wallet, type, dareMint, remarks } = body;

    // Validate required fields
    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "wallet is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "type is required and must be a string",
        },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_GATEWAY environment variable not set");
    }

    // Get admin API secret from environment variables
    const adminApiSecret = process.env.ADMIN_API_SECRET;
    if (!adminApiSecret) {
      return NextResponse.json(
        { success: false, message: "Admin API secret not configured" },
        { status: 500 }
      );
    }

    console.log(
      `[Send Notification API] Sending ${type} notification to ${wallet}`
    );
    // Generate JWT token for admin authentication
    const adminToken = jwt.sign({ admin: true }, adminApiSecret, {
      expiresIn: "24h",
    });

    // Prepare request body for backend API
    const requestBody: SendNotificationRequest = {
      wallet,
      type,
      ...(dareMint && { dareMint }),
      ...(remarks && { remarks }),
    };

    // Call backend API to send notification
    const response = await axios.post<SendNotificationResponse>(
      `${baseUrl}/api/notifications`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.error || "Failed to send notification from backend"
      );
    }

    console.log(
      `[Send Notification API] Successfully sent notification:`,
      response.data
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("[Send Notification API] Error sending notification:", error);
    const formattedErrorMsg: string = cleanUpErrorMessage(String(error));
    return sendErrorResponse(formattedErrorMsg);
  }
}

export const dynamic = "force-dynamic";
