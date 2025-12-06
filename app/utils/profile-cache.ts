import { ProfileData, ProfileBatchResponse } from "@/types";
import axios from "axios";

/**
 * Cache entry with timestamp for TTL management
 */
type CacheEntry = {
  profile: ProfileData;
  timestamp: number;
};

/**
 * In-memory cache for profile data
 * Key: wallet address
 * Value: { profile, timestamp }
 */
const profileCache = new Map<string, CacheEntry>();

/**
 * Cache duration: 15 minutes in milliseconds
 */
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Check if a cache entry is still valid based on TTL
 */
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
};

/**
 * Get profile from cache if available and valid
 * Returns null if not cached or expired
 */
const getFromCache = (wallet: string): ProfileData | null => {
  const entry = profileCache.get(wallet);
  if (!entry) return null;

  if (isCacheValid(entry)) {
    return entry.profile;
  }

  // Remove expired entry
  profileCache.delete(wallet);
  return null;
};

/**
 * Store profile in cache with current timestamp
 */
const setInCache = (profile: ProfileData): void => {
  profileCache.set(profile.wallet, {
    profile,
    timestamp: Date.now(),
  });
};

/**
 * Fetch profiles from the batch API endpoint
 * Internal function - use getCachedProfiles instead
 */
const fetchProfilesBatch = async (
  wallets: string[]
): Promise<ProfileData[]> => {
  if (wallets.length === 0) {
    return [];
  }

  try {
    const response = await axios.post<ProfileBatchResponse>(
      "/profile/batch",
      { wallets },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data?.success || !response.data?.data) {
      throw new Error(
        response.data?.error || "Failed to fetch profile batch"
      );
    }

    return response.data.data;
  } catch (error) {
    console.error("[Profile Cache] Error fetching profiles:", error);
    // Return empty profiles for failed wallets
    return wallets.map((wallet) => ({
      wallet,
      username: null,
      displayName: null,
      avatarCid: null,
      twitter: null,
    }));
  }
};

/**
 * Get profiles for multiple wallets with caching
 *
 * This function:
 * 1. Checks cache for each wallet
 * 2. Only fetches uncached/expired wallets from API
 * 3. Updates cache with new profiles
 * 4. Returns Map of wallet -> ProfileData
 *
 * @param wallets - Array of wallet addresses to fetch profiles for
 * @returns Map of wallet address to ProfileData
 */
export const getCachedProfiles = async (
  wallets: string[]
): Promise<Map<string, ProfileData>> => {
  const result = new Map<string, ProfileData>();
  const walletsToFetch: string[] = [];

  // Deduplicate and filter out empty/invalid wallets
  const uniqueWallets = Array.from(
    new Set(wallets.filter((w) => w && w.trim() !== ""))
  );

  // Check cache for each wallet
  for (const wallet of uniqueWallets) {
    const cached = getFromCache(wallet);
    if (cached) {
      result.set(wallet, cached);
    } else {
      walletsToFetch.push(wallet);
    }
  }

  // Fetch uncached wallets if any
  if (walletsToFetch.length > 0) {
    console.log(
      `[Profile Cache] Fetching ${walletsToFetch.length} profiles from API`
    );
    const fetchedProfiles = await fetchProfilesBatch(walletsToFetch);

    // Store in cache and result
    for (const profile of fetchedProfiles) {
      setInCache(profile);
      result.set(profile.wallet, profile);
    }
  }

  console.log(
    `[Profile Cache] Returning ${result.size} profiles (${result.size - walletsToFetch.length} from cache, ${walletsToFetch.length} fresh)`
  );

  return result;
};

/**
 * Clear all cached profiles
 * Useful for testing or manual cache invalidation
 */
export const clearProfileCache = (): void => {
  profileCache.clear();
  console.log("[Profile Cache] Cache cleared");
};

/**
 * Get cache statistics for debugging
 */
export const getProfileCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  profileCache.forEach((entry) => {
    if (isCacheValid(entry)) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });

  return {
    totalEntries: profileCache.size,
    validEntries,
    expiredEntries,
    cacheTtlMs: CACHE_TTL_MS,
  };
};
