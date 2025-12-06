import { NextResponse } from "next/server";

export const sendErrorResponse = (errorMsg: string): Response => {
  return NextResponse.json({
    type: "error",
    message: errorMsg,
  });
};

export const cleanUpErrorMessage = (errorMessage: string): string => {
  const cleanedErrorMessage: string = errorMessage.replace(/error|:/gi, "");
  return "Error: " + cleanedErrorMessage;
};

// Export auth helper functions
export { getApiToken, getAuthHeader } from "./auth";
