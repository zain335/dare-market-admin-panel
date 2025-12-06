import { DareIPFSMetadata } from "@/types";
import { fetchFromIPFS } from "./ipfs";

/**
 * In-memory cache for IPFS metadata
 * Key: IPFS CID, Value: Metadata object
 */
const metadataCache = new Map<string, DareIPFSMetadata>();

/**
 * Get metadata from cache or fetch from IPFS
 * @param cid - IPFS CID
 * @returns Promise resolving to metadata
 */
export async function getCachedIPFSMetadata(
  cid: string
): Promise<DareIPFSMetadata> {
  // Check cache first
  if (metadataCache.has(cid)) {
    return metadataCache.get(cid)!;
  }

  // Fetch from IPFS if not cached
  try {
    const metadata = await fetchFromIPFS(cid);
    metadataCache.set(cid, metadata);
    return metadata;
  } catch (error) {
    // Return empty metadata on error to prevent blocking
    const emptyMetadata: DareIPFSMetadata = {
      title: "",
      description: "",
      properties: {
        rules: [],
      },
    };
    metadataCache.set(cid, emptyMetadata);
    return emptyMetadata;
  }
}

/**
 * Prefetch metadata for multiple CIDs
 * @param cids - Array of IPFS CIDs
 * @returns Promise that resolves when all metadata is fetched
 */
export async function prefetchIPFSMetadata(
  cids: string[]
): Promise<Map<string, DareIPFSMetadata>> {
  const results = new Map<string, DareIPFSMetadata>();

  // Fetch all metadata in parallel
  await Promise.allSettled(
    cids.map(async (cid) => {
      if (!cid || cid.trim() === "") return;

      try {
        const metadata = await getCachedIPFSMetadata(cid);
        results.set(cid, metadata);
      } catch (error) {
        console.error(`Failed to fetch metadata for CID ${cid}:`, error);
        results.set(cid, {
          title: "",
          description: "",
          properties: {
            rules: [],
          },
        });
      }
    })
  );

  return results;
}

/**
 * Clear the entire cache
 */
export function clearIPFSCache(): void {
  metadataCache.clear();
}

/**
 * Get cache size
 */
export function getIPFSCacheSize(): number {
  return metadataCache.size;
}
