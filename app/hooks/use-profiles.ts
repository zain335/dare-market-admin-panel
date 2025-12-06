"use client";
import { useState, useEffect } from "react";
import { ProfileData } from "@/types";
import { getCachedProfiles } from "@/utils/profile-cache";

/**
 * Hook for fetching and caching user profiles
 *
 * @param wallets - Array of wallet addresses to fetch profiles for
 * @returns Object containing profiles Map, loading state, and error
 */
export const useProfiles = (wallets: string[]) => {
  const [profiles, setProfiles] = useState<Map<string, ProfileData>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Stringify wallet array for stable dependency
  const walletsKey = wallets.join(",");

  useEffect(() => {
    // Don't fetch if no wallets provided
    if (!wallets || wallets.length === 0) {
      setProfiles(new Map());
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const profilesMap = await getCachedProfiles(wallets);

        if (isMounted) {
          setProfiles(profilesMap);
        }
      } catch (err) {
        console.error("[useProfiles] Error fetching profiles:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfiles();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletsKey]); // Dependency on stringified wallet array to avoid infinite loops

  return {
    profiles,
    isLoading,
    error,
  };
};
