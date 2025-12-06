import { DareItem } from "@/types";

/**
 * Check if a dare has expired based on openTimestamp and openDuration
 * @param dare - The dare item to check
 * @returns true if the dare has expired, false otherwise
 */
export const isDareExpired = (dare: DareItem): boolean => {
  if (!dare?.openTimestamp || !dare?.openDuration) return false;
  const currentTime = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
  const endTime = dare.openTimestamp + dare.openDuration;
  return currentTime > endTime;
};

/**
 * Format timestamp to readable date
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 */
export const formatDareTimestamp = (timestamp: number): string => {
  if (!timestamp || timestamp === 0) return "Not set";
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Calculate time remaining for a dare
 * @param dare - The dare item
 * @returns Time remaining in seconds, or 0 if expired
 */
export const getDareTimeRemaining = (dare: DareItem): number => {
  if (!dare?.openTimestamp || !dare?.openDuration) return 0;
  const currentTime = Math.floor(Date.now() / 1000);
  const endTime = dare.openTimestamp + dare.openDuration;
  const remaining = endTime - currentTime;
  return remaining > 0 ? remaining : 0;
};
