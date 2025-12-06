import {
  cleanUpErrorMessage,
  sendErrorResponse,
} from "@/helpers";
import { NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";

type CompleteDareTokenlessRequest = {
  dareStatePublicKey: string;
  player: string;
  isSuccessful?: boolean;
  moderatorPublicKey?: string;
};

type CompleteDareTokenlessResponse = {
  success: boolean;
  transaction?: string;
  dareStateAddress?: string;
  playerPublicKey?: string;
  error?: string;
  message?: string;
};

/**
 * POST endpoint to complete a tokenless dare (mark as completed or failed)
 * When successful, automatically triggers next-level voting session creation
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body: CompleteDareTokenlessRequest = await req.json();
    const { dareStatePublicKey, player, isSuccessful, moderatorPublicKey } = body;

    // Validate required fields
    if (!dareStatePublicKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Dare state public key is required",
        },
        { status: 400 }
      );
    }

    if (!player) {
      return NextResponse.json(
        {
          success: false,
          message: "Player wallet address is required",
        },
        { status: 400 }
      );
    }

    // Basic Solana public key length check for dareStatePublicKey
    if (dareStatePublicKey.length < 32 || dareStatePublicKey.length > 44) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Dare state public key must be a valid Solana public key (base58 string)",
        },
        { status: 400 }
      );
    }

    // Validate player public key
    if (player.length < 32 || player.length > 44) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Player wallet address must be a valid Solana public key (base58 string)",
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

    // Prepare request body with player field
    const requestBody: CompleteDareTokenlessRequest = {
      dareStatePublicKey,
      player,
      isSuccessful: isSuccessful !== undefined ? isSuccessful : true,
      moderatorPublicKey,
    };

    // Make API request to the backend
    const response = await axios.post<CompleteDareTokenlessResponse>(
      `${baseUrl}/api/moderator/complete-dare-tokenless`,
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
