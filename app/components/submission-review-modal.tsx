"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcn/ui/dialog";
import { Button } from "@/components/shadcn/ui/button";
import { Textarea } from "@/components/shadcn/ui/textarea";
import { Badge } from "@/components/shadcn/ui/badge";
import {
  XCircle,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Trophy,
  Video,
  Ban,
  Play,
} from "lucide-react";
import { Submission, DareItem } from "@/types";
import MuxPlayer from "@mux/mux-player-react";

interface SubmissionReviewModalProps {
  submission: Submission | null;
  dareData?: DareItem | null;
  open: boolean;
  onClose: () => void;
  onVoid: (submissionId: string, notes?: string) => Promise<void>;
  onReject: (submissionId: string, notes?: string) => Promise<void>;
  onWinner: (submissionId: string, notes?: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Get status color for submission status
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
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Truncate address for display
 */
const truncateAddress = (address: string, start: number = 8, end: number = 8) => {
  if (!address) return "N/A";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * Format timestamp to readable date in user's local timezone
 */
const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString);
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
 * Format duration in seconds to MM:SS
 */
const formatDuration = (seconds: number) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Get status badge for VOD status
 */
const getVODStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    ready: { label: "Ready", className: "bg-green-100 text-green-800" },
    preparing: { label: "Processing...", className: "bg-yellow-100 text-yellow-800" },
    errored: { label: "Error", className: "bg-red-100 text-red-800" },
  };

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

/**
 * Submission review modal component
 * Displays submission details and allows moderators to reject or mark as winner
 */
export default function SubmissionReviewModal({
  submission,
  dareData,
  open,
  onClose,
  onVoid,
  onReject,
  onWinner,
  isLoading,
}: SubmissionReviewModalProps) {
  const [notes, setNotes] = useState<string>("");
  const [selectedVodIndex, setSelectedVodIndex] = useState(0);

  if (!submission) return null;

  /**
   * Handle void action (blockchain transaction + API)
   */
  const handleVoid = async () => {
    await onVoid(submission.id, notes);
    setNotes("");
  };

  /**
   * Handle reject action (API only)
   */
  const handleReject = async () => {
    await onReject(submission.id, notes);
    setNotes("");
  };

  /**
   * Handle winner action
   */
  const handleWinner = async () => {
    await onWinner(submission.id, notes);
    setNotes("");
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Review Submission
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Status</span>
            <Badge className={getSubmissionStatusColor(submission.status)}>
              {submission.status}
            </Badge>
          </div>

          {/* Submitter Information */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>Submitter Wallet</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-mono text-sm break-all">
                {submission.submitterWallet}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 p-0 h-auto text-blue-600"
                asChild
              >
                <a
                  href={`https://solscan.io/account/${submission.submitterWallet}`}
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

          {/* Submitter Slot */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Submitter Slot</span>
            <span className="font-medium">Slot {submission.submitterSlot + 1}</span>
          </div>

          {/* Proof URL */}
          {submission.proofUrl && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ExternalLink className="w-4 h-4" />
                <span>Proof URL</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm break-all mb-2">{submission.proofUrl}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-blue-600"
                  asChild
                >
                  <a
                    href={submission.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open Link
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Proof IPFS CID */}
          {submission.proofIpfsCid && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>Proof IPFS CID</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-mono text-sm break-all mb-2">
                  {submission.proofIpfsCid}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-blue-600"
                  asChild
                >
                  <a
                    href={`https://ipfs.io/ipfs/${submission.proofIpfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on IPFS
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Description */}
          {submission.description && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>Description</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm whitespace-pre-wrap">
                  {submission.description}
                </p>
              </div>
            </div>
          )}

          {/* Video Recording Section - VODs from dbDare.streams[slotIndex].vods */}
          {(() => {
            // Extract VODs for this submission's slot
            const slotIndex = submission.submitterSlot;
            const streamData = dareData?.dbDare?.streams?.[slotIndex];
            const vods = streamData?.vods || [];
            const selectedVod = vods[selectedVodIndex] || null;

            if (vods.length === 0) {
              return (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Video className="w-4 h-4" />
                    <span>Video Recording</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-500 italic">
                      No video recordings available. The recording may still be processing or the submission was made without video.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Video className="w-4 h-4" />
                    <span>Video Recording</span>
                    {vods.length > 1 && (
                      <Badge variant="secondary" className="ml-2">
                        {vods.length} Videos
                      </Badge>
                    )}
                  </div>
                  {selectedVod?.status && (
                    <div>{getVODStatusBadge(selectedVod.status)}</div>
                  )}
                </div>

                {/* Main Video Player */}
                {selectedVod?.playbackId ? (
                  <div className="bg-gray-50 rounded-md overflow-hidden">
                    <MuxPlayer
                      streamType="on-demand"
                      playbackId={selectedVod.playbackId}
                      metadata={{
                        video_id: submission.id,
                        video_title: `Submission ${selectedVodIndex + 1} by ${truncateAddress(
                          submission.submitterWallet
                        )}`,
                      }}
                      autoPlay={false}
                      className="w-full aspect-video"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-500">Video not available for playback</p>
                  </div>
                )}

                {/* VOD Carousel - Show thumbnails if multiple videos */}
                {vods.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Select Video:</p>
                    <div className="grid grid-cols-4 gap-3">
                      {vods.map((vod: any, index: number) => (
                        <div
                          key={vod.muxAssetId || index}
                          onClick={() => setSelectedVodIndex(index)}
                          className={`
                            cursor-pointer border-2 rounded-lg overflow-hidden transition-all
                            ${selectedVodIndex === index
                              ? "border-purple-500 ring-2 ring-purple-200"
                              : "border-gray-200 hover:border-gray-400"
                            }
                          `}
                        >
                          <div className="relative aspect-video bg-gray-900">
                            {/* Thumbnail - use Mux thumbnail if available */}
                            {vod.playbackId ? (
                              <img
                                src={`https://image.mux.com/${vod.playbackId}/thumbnail.jpg?width=214&height=120&time=1`}
                                alt={`Video ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-gray-600" />
                              </div>
                            )}

                            {/* Play icon overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                              <Play className="w-10 h-10 text-white opacity-0 hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Duration badge */}
                            {vod.duration && (
                              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                {formatDuration(vod.duration)}
                              </div>
                            )}

                            {/* Selected indicator */}
                            {selectedVodIndex === index && (
                              <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                                Playing
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Metadata */}
                {selectedVod && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedVod.duration && (
                      <div>
                        <span className="font-medium">Duration:</span> {formatDuration(selectedVod.duration)}
                      </div>
                    )}
                    {selectedVod.maxStoredResolution && (
                      <div>
                        <span className="font-medium">Resolution:</span> {selectedVod.maxStoredResolution}
                      </div>
                    )}
                    {selectedVod.aspectRatio && (
                      <div>
                        <span className="font-medium">Aspect Ratio:</span> {selectedVod.aspectRatio}
                      </div>
                    )}
                    {selectedVod.createdAt && (
                      <div>
                        <span className="font-medium">Recorded:</span>{" "}
                        {new Date(selectedVod.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Submitted At</span>
              </div>
              <p className="text-sm font-medium">
                {formatTimestamp(submission.submittedAt)}
              </p>
            </div>
            {submission.reviewedAt && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Reviewed At</span>
                </div>
                <p className="text-sm font-medium">
                  {formatTimestamp(submission.reviewedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Reviewed By */}
          {submission.reviewedBy && (
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Reviewed By</span>
              <p className="font-mono text-sm break-all p-2 bg-gray-50 rounded">
                {submission.reviewedBy}
              </p>
            </div>
          )}

          {/* Previous Moderator Notes */}
          {submission.moderatorNotes && (
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Previous Notes</span>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm whitespace-pre-wrap">
                  {submission.moderatorNotes}
                </p>
              </div>
            </div>
          )}

          {/* Moderator Notes Input */}
          {(submission.status === "PENDING" || submission.status === "REJECTED") && (
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm text-gray-600">
                Moderator Notes (Optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add notes about your decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {submission.status === "PENDING" && (
            <>
              <Button
                variant="destructive"
                onClick={handleVoid}
                disabled={isLoading}
                className="flex items-center bg-purple-700 hover:bg-purple-800"
              >
                <Ban className="w-4 h-4 mr-2" />
                {isLoading ? "Deleting..." : "DELETE SLOT"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isLoading ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                onClick={handleWinner}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 flex items-center"
              >
                <Trophy className="w-4 h-4 mr-2" />
                {isLoading ? "Marking..." : "Mark Winner"}
              </Button>
            </>
          )}
          {submission.status === "REJECTED" && (
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={isLoading}
              className="flex items-center bg-purple-700 hover:bg-purple-800"
            >
              <Ban className="w-4 h-4 mr-2" />
              {isLoading ? "Deleting..." : "EMPTY SLOT"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

