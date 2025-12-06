import axios from "axios";
import {
  SendNotificationRequest,
  SendNotificationResponse,
  NotificationType,
} from "@/types";

/**
 * Send a notification to a user via the backend notification API
 *
 * This function handles errors silently - notifications should not block the main operation.
 * If the notification fails to send, it will be logged to the console but will not throw an error.
 *
 * @param wallet - Target wallet address (recipient)
 * @param type - Notification type (e.g., "DARE_ACCEPTED", "DARE_FAILED")
 * @param dareMint - Optional dare token mint address
 * @param remarks - Optional additional message/remarks
 * @returns Promise<boolean> - True if notification sent successfully, false otherwise
 *
 * @example
 * ```typescript
 * // Send notification after approving a dare
 * sendNotification(
 *   dareData.creator,
 *   "DARE_ACCEPTED",
 *   dareData.tokenMint,
 *   "Your dare has been approved by moderators"
 * ).catch(err => console.error("Notification failed:", err));
 * ```
 */
export async function sendNotification(
  wallet: string,
  type: NotificationType,
  dareMint?: string,
  remarks?: string
): Promise<boolean> {
  try {
    // Validate required parameters
    if (!wallet || !type) {
      console.warn("[Notification] Missing required parameters:", {
        wallet,
        type,
      });
      return false;
    }

    // Prepare request body
    const requestBody: SendNotificationRequest = {
      wallet,
      type,
      ...(dareMint && { dareMint }),
      ...(remarks && { remarks }),
    };

    console.log(`[Notification] Sending ${type} notification to ${wallet}`);

    // Call Next.js API route which forwards to backend
    const response = await axios.post<SendNotificationResponse>(
      "/notifications/send",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.success) {
      console.log("[Notification] Successfully sent notification:", {
        type,
        wallet,
        dareMint,
      });
      return true;
    } else {
      console.warn(
        "[Notification] Backend returned unsuccessful response:",
        response.data
      );
      return false;
    }
  } catch (error) {
    // Silent fail - notifications should not block main operations
    console.error("[Notification] Error sending notification:", {
      error: error instanceof Error ? error.message : String(error),
      wallet,
      type,
      dareMint,
    });
    return false;
  }
}
