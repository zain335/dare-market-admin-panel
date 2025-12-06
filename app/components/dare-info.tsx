"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import { Badge } from "@/components/shadcn/ui/badge";
import { Button } from "@/components/shadcn/ui/button";
import { Separator } from "@/components/shadcn/ui/separator";
import {
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Users,
  Shield,
  Timer,
  Calendar,
  FileCheck,
  Eye,
  Star,
  Loader2,
  Ban,
} from "lucide-react";
import { DareItem, Submission, DareIPFSMetadata } from "@/types";
import { format } from "date-fns";
import { fetchFromIPFS, isValidCID, getIPFSUrl } from "@/utils/ipfs";
import { isDareExpired } from "@/utils/dare";
import { getCachedSolPrice, lamportsToUsd } from "@/utils/sol-price";
import { useProfiles } from "@/hooks/use-profiles";
import ProfileAvatar from "./profile-avatar";

interface DareInfoProps {
  dare: DareItem;
  onApprove?: () => void;
  onReject?: () => void;
  onFailDareByTime?: () => void;
  onToggleFeatured?: () => void;
  onToggleDisabled?: () => void;
  isLoading?: boolean;
  isFailingDare?: boolean;
  isTogglingFeatured?: boolean;
  isTogglingDisabled?: boolean;
  isRefreshing?: boolean;
  onViewSubmission?: (submission: Submission) => void;
  onRejectPendingSubmission?: (submitterWallet: string) => void;
  rejectingPendingWallet?: string | null;
}

/**
 * Get status color for dare status
 */
const getDareStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "accepted":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "open":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "unverified":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Get trade status color
 */
const getTradeStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-green-100 text-green-800 border-green-200";
    case "closed":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Get submission status color
 */
const getSubmissionStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    case "WINNER":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "SUBMISSION_PENDING":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Get status icon for dare status
 */
const getDareStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "accepted":
      return <Timer className="w-4 h-4" />;
    case "open":
      return <AlertCircle className="w-4 h-4" />;
    case "unverified":
      return <XCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

/**
 * Format timestamp to readable date in user's local timezone
 */
const formatTimestamp = (timestamp: number) => {
  if (timestamp === 0) return "Not set";
  const date = new Date(timestamp * 1000);
  // Format with locale string using browser's local timezone
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
};

/**
 * Calculate and format expiry time (open time + duration) in user's local timezone
 */
const formatExpiryTime = (openTimestamp: number, openDuration: number) => {
  if (openTimestamp === 0) return "Not set";
  const expiryTimestamp = openTimestamp + openDuration;
  const date = new Date(expiryTimestamp * 1000);
  // Format with locale string using browser's local timezone
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
};

/**
 * Format duration in seconds to human readable
 */
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h`;
};

/**
 * Format payout amount from smallest unit to SOL
 */
const formatPayout = (payout: string) => {
  const payoutInSol = (parseFloat(payout) / 1_000_000_000).toFixed(4);
  return `${payoutInSol} SOL`;
};

/**
 * Truncate address for display
 */
const truncateAddress = (
  address: string,
  start: number = 8,
  end: number = 8
) => {
  if (!address) return "N/A";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * Dare information display component
 * Shows detailed information about a dare including status, payout, timing, etc.
 */
export default function DareInfo({
  dare,
  onApprove,
  onReject,
  onFailDareByTime,
  onToggleFeatured,
  onToggleDisabled,
  isLoading,
  isFailingDare,
  isTogglingFeatured,
  isTogglingDisabled,
  isRefreshing,
  onViewSubmission,
  onRejectPendingSubmission,
  rejectingPendingWallet,
}: DareInfoProps) {
  const [ipfsMetadata, setIpfsMetadata] = useState<DareIPFSMetadata | null>(
    null
  );
  const [ipfsLoading, setIpfsLoading] = useState(false);
  const [ipfsError, setIpfsError] = useState<string | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);

  // Extract all unique wallet addresses for profile fetching
  const allWallets = useMemo(() => {
    const wallets: string[] = [];

    // Add creator wallet
    if (dare?.creator) {
      wallets.push(dare.creator);
    }

    // Add submitter wallets (filter out null slots)
    if (dare?.submitters) {
      dare.submitters.forEach((submitter) => {
        if (submitter) {
          wallets.push(submitter);
        }
      });
    }

    // Add submission wallets
    if (dare?.submissions) {
      dare.submissions.forEach((submission) => {
        if (submission.submitterWallet) {
          wallets.push(submission.submitterWallet);
        }
      });
    }

    // Return unique wallets
    return Array.from(new Set(wallets));
  }, [dare?.creator, dare?.submitters, dare?.submissions]);

  // Fetch profiles for all wallets
  const { profiles, isLoading: profilesLoading } = useProfiles(allWallets);

  /**
   * Extracts the IPFS CID from various URL formats and returns a gateway URL using Pinata
   * Supports: ipfs://CID, https://gateway.../ipfs/CID, or raw CID
   */
  const getIPFSImageUrl = (imageUrl: string): string => {
    if (!imageUrl) {
      return "";
    }

    // If it starts with ipfs://, extract the CID
    if (imageUrl.startsWith("ipfs://")) {
      const cid = imageUrl.replace("ipfs://", "");
      return getIPFSUrl(cid);
    }

    // If it contains /ipfs/, extract the CID from the URL
    const ipfsMatch = imageUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    if (ipfsMatch && ipfsMatch[1]) {
      return getIPFSUrl(ipfsMatch[1]);
    }

    // If it's already a valid CID, use it directly
    if (isValidCID(imageUrl)) {
      return getIPFSUrl(imageUrl);
    }

    // Otherwise, return the original URL (might be a regular HTTP URL)
    return imageUrl;
  };

  // Fetch IPFS metadata when component mounts or CID changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!dare?.ipfsCid || !isValidCID(dare.ipfsCid)) {
        setIpfsMetadata(null);
        setIpfsError(null);
        return;
      }

      setIpfsLoading(true);
      setIpfsError(null);

      try {
        const metadata = await fetchFromIPFS(dare.ipfsCid);
        setIpfsMetadata(metadata);
      } catch (error) {
        console.error("Failed to fetch IPFS metadata:", error);
        setIpfsError(
          error instanceof Error ? error.message : "Failed to load content"
        );
        setIpfsMetadata(null);
      } finally {
        setIpfsLoading(false);
      }
    };

    fetchMetadata();
  }, [dare?.ipfsCid]);

  // Fetch SOL price when component mounts
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const price = await getCachedSolPrice();
        setSolPrice(price);
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
        setSolPrice(null);
      }
    };

    fetchSolPrice();
  }, []);

  // Check if any submission has winner status
  const hasWinner = dare?.submissions?.some((sub) => sub?.status === "WINNER");

  // Create a map of submissions by submitter wallet for quick lookup
  const submissionsByWallet = new Map<string, Submission>();
  dare?.submissions?.forEach((sub) => {
    if (sub && sub.submitterWallet) {
      submissionsByWallet.set(sub.submitterWallet, sub);
    }
  });

  // Get all submitters (including those without submissions)
  const allSubmitters = dare?.submitters || [];
  const activeSubmitters = allSubmitters.filter((s) => s !== null);

  // Check if we should show the submissions section
  const hasSubmissions = dare?.submissions && dare.submissions.length > 0;
  const hasSubmitters = activeSubmitters.length > 0;
  const shouldShowSubmissionsSection = hasSubmissions || hasSubmitters;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl font-semibold text-gray-900">
                  {ipfsMetadata?.name || "Dare"}
                </CardTitle>
                {isRefreshing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-3 font-mono text-sm">
                Token: {truncateAddress(dare?.tokenMint, 12, 12)}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  className={`${getDareStatusColor(
                    dare?.dareStatus || "unverified"
                  )} flex items-center gap-1`}
                >
                  {getDareStatusIcon(dare?.dareStatus || "unverified")}
                  {dare?.dareStatus || "unverified"}
                </Badge>
                <Badge
                  className={`${getTradeStatusColor(
                    dare?.tradeStatus || "closed"
                  )} flex items-center gap-1`}
                >
                  {dare?.tradeStatus === "open" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  Trade {dare?.tradeStatus || "closed"}
                </Badge>
                {dare?.isBlocked && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Blocked
                  </Badge>
                )}
                {dare?.isFeatured && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {dare?.isDisabled && (
                  <Badge className="bg-gray-200 text-gray-800 border-gray-300">
                    <XCircle className="w-3 h-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              {/* Featured Toggle Button - Hidden for censored dares */}
              {dare?.dareStatus !== "censored" && (
                <Button
                  onClick={onToggleFeatured}
                  variant={dare?.isFeatured ? "primary" : "outline"}
                  disabled={isTogglingFeatured}
                  className={
                    dare?.isFeatured
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "border-amber-600 text-amber-600 hover:bg-amber-50"
                  }
                >
                  {isTogglingFeatured ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Star
                      className={`w-4 h-4 mr-2 ${dare?.isFeatured ? "fill-current" : ""
                        }`}
                    />
                  )}
                  {isTogglingFeatured
                    ? "Updating..."
                    : dare?.isFeatured
                      ? "Unfeature"
                      : "Feature"}
                </Button>
              )}
              {/* Disable/Enable Toggle Button */}
              <Button
                onClick={onToggleDisabled}
                variant={dare?.isDisabled ? "destructive" : "outline"}
                disabled={isTogglingDisabled}
                className={
                  dare?.isDisabled
                    ? "bg-red-600 hover:bg-red-700"
                    : "border-red-600 text-red-600 hover:bg-red-50"
                }
              >
                {isTogglingDisabled ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                {isTogglingDisabled
                  ? "Updating..."
                  : dare?.isDisabled
                    ? "Enable Dare"
                    : "Disable Dare"}
              </Button>

              {/* Approve/Reject Buttons */}
              {(dare?.dareStatus === "unverified" ||
                dare?.dareStatus === "open" ||
                dare?.dareStatus === "failed") && (
                  <div className="flex space-x-2">
                    {dare?.dareStatus === "unverified" && (
                      <>
                        <Button
                          onClick={onApprove}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {isLoading ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          onClick={onReject}
                          variant="destructive"
                          disabled={isLoading}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {isLoading ? "Rejecting..." : "Reject"}
                        </Button>
                      </>
                    )}

                    {dare?.dareStatus === "open" && (
                      <>
                        <Button
                          disabled
                          className="bg-green-100 text-green-800 border-green-300 cursor-not-allowed w-full"
                          variant="outline"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approved
                        </Button>
                      </>
                    )}

                    {dare?.dareStatus === "failed" && (
                      <>
                        <Button
                          disabled
                          className="bg-red-100 text-red-800 border-red-300 cursor-not-allowed w-full"
                          variant="outline"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejected
                        </Button>
                      </>
                    )}

                    {dare?.dareStatus === "open" && isDareExpired(dare) && (
                      <Button
                        onClick={onFailDareByTime}
                        variant="destructive"
                        disabled={isFailingDare}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {isFailingDare ? "Failing..." : "Fail This Dare"}
                      </Button>
                    )}
                  </div>
                )}
            </div>
          </div>
        </CardHeader>
      </Card>
      {/* IPFS Content Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ExternalLink className="w-5 h-5 mr-2" />
            Dare Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loading State */}
          {ipfsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">
                Loading content from IPFS...
              </span>
            </div>
          )}

          {/* Error State */}
          {ipfsError && !ipfsLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium mb-1">
                Failed to load content
              </p>
              <p className="text-xs text-red-600">{ipfsError}</p>
            </div>
          )}

          {/* Metadata Display */}
          {ipfsMetadata && !ipfsLoading && (
            <div className="flex gap-6">
              {/* Left Side - Details */}
              <div className="flex-1 space-y-4">
                {/* Description */}
                {ipfsMetadata.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Description
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {ipfsMetadata.description}
                    </p>
                  </div>
                )}

                {/* Rules */}
                {ipfsMetadata.properties.rules &&
                  ipfsMetadata.properties.rules.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Rules
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {ipfsMetadata.properties.rules.map((rule, index) => (
                          <li key={index} className="text-sm text-gray-800">
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              {/* Right Side - Image */}
              {ipfsMetadata.image && (
                <div className="flex-shrink-0">
                  <img
                    src={getIPFSImageUrl(ipfsMetadata.image)}
                    alt={ipfsMetadata.name || "Dare image"}
                    className="w-80 h-40 object-cover rounded-md border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Video Section - Keep below the main content */}
          {ipfsMetadata && !ipfsLoading && ipfsMetadata.video && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Video</p>
              <video
                src={ipfsMetadata.video}
                controls
                className="w-full rounded-md border border-gray-200"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* External Links Section - Keep below */}
          {ipfsMetadata && !ipfsLoading && ipfsMetadata.external_url && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                External Link
              </p>
              <a
                href={ipfsMetadata.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
              >
                {ipfsMetadata.external_url}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          )}

          {/* IPFS CID Information */}
          <div>
            <p className="text-sm text-gray-500 mb-2">IPFS Content ID</p>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-mono text-sm break-all">
                {dare?.ipfsCid || "N/A"}
              </p>
              {dare?.ipfsCid && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 p-0 h-auto text-blue-600"
                  asChild
                >
                  <a
                    href={`https://ipfs.io/ipfs/${dare.ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on IPFS
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payout Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Coins className="w-5 h-5 mr-2" />
              Payout Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Payout</p>
              <p className="text-3xl font-bold text-green-600">
                {formatPayout(dare?.payout || "0")}
              </p>
              {solPrice !== null && dare?.payout && (
                <p className="text-lg text-gray-700 mt-2 font-semibold">
                  {lamportsToUsd(dare.payout, solPrice)} USD
                </p>
              )}
              {solPrice === null && (
                <p className="text-xs text-gray-400 mt-1">
                  USD price unavailable
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Creator Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Users className="w-5 h-5 mr-2" />
              Creator Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <ProfileAvatar
                  wallet={dare?.creator || ""}
                  profile={profiles.get(dare?.creator || "")}
                  size="md"
                  isLoading={profilesLoading}
                />
                <div className="flex-1 min-w-0">
                  {profilesLoading ? (
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">
                        {truncateAddress(dare?.creator || "", 6, 6)}
                      </p>
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <>
                      {profiles.get(dare?.creator || "")?.username && (
                        <p className="font-medium text-sm mb-1">
                          {profiles.get(dare?.creator || "")?.username}
                        </p>
                      )}
                      <p className="font-mono text-xs text-gray-600">
                        {truncateAddress(dare?.creator || "", 6, 6)}
                      </p>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-blue-600 shrink-0"
                  asChild
                >
                  <a
                    href={`https://solscan.io/account/${dare?.creator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on Solscan
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="w-5 h-5 mr-2" />
              Timing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Open Time</p>
                <p className="font-medium text-sm">
                  {formatTimestamp(dare?.openTimestamp || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Timer className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium text-sm">
                  {formatDuration(dare?.openDuration || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Expiry Time</p>
                <p className="font-medium text-sm">
                  {formatExpiryTime(
                    dare?.openTimestamp || 0,
                    dare?.openDuration || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submitters Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Users className="w-5 h-5 mr-2" />
              Submitters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">
                Active Submitters (
                {dare?.submitters?.filter((s) => s != null).length || 0}/
                {dare?.submitters?.length || 0})
              </p>
              {dare?.submitters?.map((submitter, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 rounded-md flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">
                    Slot {index + 1}:
                  </span>
                  {submitter ? (
                    <div className="flex items-center gap-2">
                      <ProfileAvatar
                        wallet={submitter}
                        profile={profiles.get(submitter)}
                        size="sm"
                        isLoading={profilesLoading}
                      />
                      <div className="flex-1 min-w-0">
                        {profiles.get(submitter)?.username &&
                          !profilesLoading && (
                            <p className="font-medium text-xs truncate">
                              {profiles.get(submitter)?.username}
                            </p>
                          )}
                        <span className="font-mono text-xs text-gray-600">
                          {truncateAddress(submitter)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-blue-600 shrink-0"
                        asChild
                      >
                        <a
                          href={`https://solscan.io/account/${submitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Empty</span>
                  )}
                </div>
              )) || (
                  <p className="text-sm text-gray-500">
                    No submitter slots available
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Section */}
      {shouldShowSubmissionsSection && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileCheck className="w-5 h-5 mr-2" />
              Submissions ({activeSubmitters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeSubmitters.map((submitterWallet, index) => {
                const submission = submitterWallet
                  ? submissionsByWallet.get(submitterWallet)
                  : null;
                const isPending = !submission;
                const status = submission
                  ? submission.status
                  : "SUBMISSION_PENDING";

                return (
                  <div
                    key={submitterWallet || `submitter-${index}`}
                    className={`flex items-center justify-between p-3 rounded-md transition-colors ${status === "WINNER"
                        ? "bg-gradient-to-r from-purple-100 to-purple-50 border-2 border-purple-300 hover:from-purple-150 hover:to-purple-100"
                        : "bg-gray-50 hover:bg-gray-100"
                      }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-sm text-gray-600 flex-shrink-0">
                        #{index + 1}
                      </span>
                      <ProfileAvatar
                        wallet={submitterWallet || ""}
                        profile={profiles.get(submitterWallet || "")}
                        size="sm"
                        isLoading={profilesLoading}
                      />
                      <div className="flex-1 min-w-0">
                        {profiles.get(submitterWallet || "")?.username &&
                          !profilesLoading && (
                            <p className="font-medium text-xs truncate">
                              {profiles.get(submitterWallet || "")?.username}
                            </p>
                          )}
                        <p className="font-mono text-xs truncate text-gray-600">
                          {truncateAddress(submitterWallet || "", 6, 6)}
                        </p>
                      </div>
                      <Badge
                        className={`${getSubmissionStatusColor(
                          status
                        )} text-xs flex-shrink-0 flex items-center gap-1`}
                      >
                        {status === "WINNER" && <Shield className="w-3 h-3" />}
                        {status === "SUBMISSION_PENDING"
                          ? "Submission Pending"
                          : status}
                      </Badge>
                    </div>
                    {isPending ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          onRejectPendingSubmission?.(submitterWallet || "")
                        }
                        className="ml-3 flex-shrink-0 h-8 !bg-purple-700 !hover:bg-purple-800"
                        disabled={rejectingPendingWallet !== null}
                      >
                        {rejectingPendingWallet === submitterWallet ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 mr-1" />
                            Empty Slot
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewSubmission?.(submission)}
                        className="ml-3 flex-shrink-0 h-8"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
