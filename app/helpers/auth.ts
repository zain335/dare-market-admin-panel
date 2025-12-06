import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * Get the API token from the NextAuth session
 * Returns the token if available, otherwise returns null
 */
export async function getApiToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.apiToken || null;
  } catch (error) {
    console.error("Error getting API token from session:", error);
    return null;
  }
}

/**
 * Get authorization header with API token
 * Returns the header object if token is available, otherwise returns empty object
 */
export async function getAuthHeader(): Promise<{ Authorization?: string }> {
  const token = await getApiToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
} 