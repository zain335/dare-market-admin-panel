import { DareIPFSMetadata } from "@/types";

/**
 * List of IPFS gateways to try when fetching content
 * Falls back to next gateway if one fails
 * Uses custom Pinata gateway from env if available (high rate limit)
 */
const getIPFSGateways = (): string[] => {
  const customGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL;
  
  // If custom gateway is provided, use it first, then fallback to public gateways
  if (customGateway) {
    // Ensure the gateway URL ends with /ipfs/ or add it
    const gatewayUrl = customGateway.endsWith("/ipfs/") 
      ? customGateway 
      : customGateway.endsWith("/") 
        ? `${customGateway}ipfs/`
        : `${customGateway}/ipfs/`;
    
    return [
      gatewayUrl,
      "https://ipfs.io/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
      "https://gateway.pinata.cloud/ipfs/",
      "https://dweb.link/ipfs/",
    ];
  }
  
  // Default public gateways if no custom gateway is configured
  return [
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://dweb.link/ipfs/",
  ];
};

/**
 * Fetches metadata from IPFS using the provided CID
 * Tries multiple gateways with timeout for reliability
 *
 * @param cid - The IPFS Content Identifier
 * @param timeoutMs - Request timeout in milliseconds (default: 10000)
 * @returns Parsed JSON metadata from IPFS
 * @throws Error if all gateways fail or timeout
 */
export async function fetchFromIPFS(
  cid: string,
  timeoutMs: number = 10000
): Promise<DareIPFSMetadata> {
  if (!cid || cid.trim() === "") {
    throw new Error("Invalid IPFS CID provided");
  }

  const errors: string[] = [];
  const gateways = getIPFSGateways();

  // Try each gateway sequentially
  for (const gateway of gateways) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${gateway}${cid}`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        errors.push(
          `${gateway}: HTTP ${response.status} - ${response.statusText}`
        );
        continue;
      }

      const data = await response.json();
      return data as DareIPFSMetadata;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errors.push(`${gateway}: Request timeout after ${timeoutMs}ms`);
        } else {
          errors.push(`${gateway}: ${error.message}`);
        }
      } else {
        errors.push(`${gateway}: Unknown error`);
      }
      // Continue to next gateway
    }
  }

  // All gateways failed
  throw new Error(
    `Failed to fetch from IPFS after trying all gateways:\n${errors.join(
      "\n"
    )}`
  );
}

/**
 * Generates a direct IPFS gateway URL for a given CID
 * Uses the primary gateway (custom Pinata gateway if available, otherwise ipfs.io)
 *
 * @param cid - The IPFS Content Identifier
 * @returns Full URL to IPFS content
 */
export function getIPFSUrl(cid: string): string {
  if (!cid || cid.trim() === "") {
    return "";
  }
  const gateways = getIPFSGateways();
  return `${gateways[0]}${cid}`;
}

/**
 * Validates if a string is a valid IPFS CID format
 * Supports both CIDv0 (Qm...) and CIDv1 (bafy...)
 *
 * @param cid - String to validate
 * @returns True if valid CID format
 */
export function isValidCID(cid: string): boolean {
  if (!cid || typeof cid !== "string") {
    return false;
  }

  // CIDv0: starts with Qm, 46 characters, base58
  const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

  // CIDv1: starts with b (base32) or z (base58)
  const cidV1Regex = /^(b[a-z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,})$/;

  return cidV0Regex.test(cid) || cidV1Regex.test(cid);
}
