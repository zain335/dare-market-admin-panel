"use client";
import React, { useState, useEffect, useRef } from "react";
import { fetchFromIPFS, isValidCID } from "@/utils/ipfs";
import { DareIPFSMetadata } from "@/types";
import { Loader2 } from "lucide-react";

interface DareTitleCellProps {
  ipfsCid: string;
  tokenMint: string;
}

/**
 * Cache for IPFS metadata to avoid re-fetching
 * Shared across all instances of DareTitleCell
 */
const metadataCache = new Map<string, DareIPFSMetadata>();

/**
 * Failed CIDs cache to avoid retrying failed fetches
 */
const failedCids = new Set<string>();

/**
 * Component to display dare title fetched from IPFS
 * Shows loading state while fetching and falls back to tokenMint if fetch fails
 */
export const DareTitleCell: React.FC<DareTitleCellProps> = ({
  ipfsCid,
  tokenMint,
}) => {
  // Initialize title from cache if available
  const getInitialTitle = (): string | null => {
    if (!ipfsCid || !isValidCID(ipfsCid)) {
      return null;
    }
    if (metadataCache.has(ipfsCid)) {
      const cachedMetadata = metadataCache.get(ipfsCid);
      return cachedMetadata?.name || cachedMetadata?.title || null;
    }
    return null;
  };

  const [title, setTitle] = useState<string | null>(getInitialTitle);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentCidRef = useRef<string | null>(null);
  const hasFetchedRef = useRef<boolean>(false);

  useEffect(() => {
    // Only reset state if ipfsCid actually changed
    const cidChanged = currentCidRef.current !== ipfsCid;

    if (cidChanged) {
      // Abort any ongoing fetch for the previous CID
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Reset state only when CID changes
      setTitle(null);
      setIsLoading(false);
      currentCidRef.current = ipfsCid;
      hasFetchedRef.current = false;
    }

    // Validate CID
    if (!ipfsCid || !isValidCID(ipfsCid)) {
      if (cidChanged) {
        setTitle(null);
      }
      return;
    }

    // Check cache first - do this before any async operations
    if (metadataCache.has(ipfsCid)) {
      const cachedMetadata = metadataCache.get(ipfsCid);
      const extractedTitle =
        cachedMetadata?.name || cachedMetadata?.title || null;
      // Use functional update to avoid dependency on title state
      setTitle((currentTitle) => {
        // Only update if different to avoid unnecessary re-renders
        return currentTitle !== extractedTitle ? extractedTitle : currentTitle;
      });
      hasFetchedRef.current = true;
      return;
    }

    // Check if this CID has failed before
    if (failedCids.has(ipfsCid)) {
      if (cidChanged) {
        setTitle(null);
      }
      hasFetchedRef.current = true;
      return;
    }

    // Don't start a new fetch if one is already in progress for this CID
    // But allow fetch on initial mount (when hasFetchedRef is false)
    if (!cidChanged && hasFetchedRef.current) {
      return;
    }

    // Create abort controller for this fetch
    abortControllerRef.current = new AbortController();
    const currentAbortController = abortControllerRef.current;

    // Fetch metadata
    const fetchMetadata = async () => {
      setIsLoading(true);
      try {
        const metadata = await fetchFromIPFS(ipfsCid);

        // Check if fetch was aborted or CID changed
        if (
          currentAbortController.signal.aborted ||
          currentCidRef.current !== ipfsCid
        ) {
          return;
        }

        // Cache the metadata
        metadataCache.set(ipfsCid, metadata);

        // Extract title from metadata (check 'name' first, then 'title' field)
        // This matches the web app implementation
        const extractedTitle = metadata?.name || metadata?.title || null;
        setTitle(extractedTitle);
      } catch (error) {
        // Check if fetch was aborted or CID changed
        if (
          currentAbortController.signal.aborted ||
          currentCidRef.current !== ipfsCid
        ) {
          return;
        }

        console.error(`Failed to fetch IPFS metadata for ${tokenMint}:`, error);

        // Mark as failed
        failedCids.add(ipfsCid);
        setTitle(null);
      } finally {
        // Only update loading state if this is still the current CID
        if (
          !currentAbortController.signal.aborted &&
          currentCidRef.current === ipfsCid
        ) {
          setIsLoading(false);
        }
      }
    };

    fetchMetadata();

    // Cleanup function
    return () => {
      if (
        abortControllerRef.current &&
        abortControllerRef.current === currentAbortController
      ) {
        abortControllerRef.current.abort();
      }
    };
  }, [ipfsCid, tokenMint]);

  // Display logic
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 font-medium">
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
        <span className="text-gray-400 text-xs">Loading...</span>
      </div>
    );
  }

  if (title) {
    return (
      <div className="font-medium text-sm max-w-[300px] truncate" title={title}>
        {title}
      </div>
    );
  }

  // Fallback to truncated tokenMint
  return (
    <div className="font-mono text-xs max-w-[300px] truncate" title={tokenMint}>
      {tokenMint.slice(0, 8)}...{tokenMint.slice(-8)}
    </div>
  );
};

export default DareTitleCell;
