import React from "react";

export type TableAction = {
  id?: string;
  name: string;
  onClick: () => void;
};

export type FormAction = {
  id?: string;
  name: string;
  onClick: () => void;
  type: "submit" | "cancel";
};

export type FilterType = {
  id: string;
  title: string;
};

export type DrawerButton = {
  id: string;
  title: string;
  href: string;
  icon?: React.ReactNode | string;
  type?: "section" | "button" | "separator";
};

/**
 * Dare status enum type
 */
export type DareStatus =
  | "unverified"
  | "censored"
  | "open"
  | "accepted"
  | "completed"
  | "failed"
  | "withdrawn"
  | "expired";

/**
 * Individual dare item from the API response
 */
export type DareItem = {
  tokenMint: string;
  creator: string;
  dareStatus: DareStatus;
  tradeStatus: string;
  payout: string;
  openTimestamp: number;
  openDuration: number;
  isBlocked: boolean;
  isDisabled?: boolean;
  submitters: (string | null)[];
  ipfsCid: string;
  submissions?: Submission[];
  isTokenless?: boolean;
  dareStatePublicKey?: string;
  isFeatured?: boolean;
  dbDare?: BackendDbDare;
};

/**
 * API response structure for dares list endpoint
 */
export type DaresListResponse = {
  success: boolean;
  data: DareItem[];
};

/**
 * Submission status type
 */
export type SubmissionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WINNER"
  | "all";

/**
 * Submission review action type
 */
export type SubmissionReviewAction = "APPROVE" | "REJECT" | "SELECT_WINNER";

/**
 * Mux recording object structure (nested under stream)
 */
export type MuxRecording = {
  assetId?: string;
  playbackId?: string;
  playbackUrl?: string;
  duration?: number;
  recordedAt?: string;
  [key: string]: any;
};

/**
 * Mux stream object structure (contains recording)
 */
export type MuxStream = {
  muxId?: string;
  playbackId?: string;
  isActive?: boolean;
  status?: string;
  recording?: MuxRecording | null;
  [key: string]: any;
};

/**
 * Individual submission data structure
 */
export type Submission = {
  id: string;
  submitterWallet: string;
  submitterSlot: number;
  proofUrl: string | null;
  proofIpfsCid: string | null;
  description: string | null;
  status: SubmissionStatus;
  moderatorNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  nextLevelConsent?: boolean;
  submittedAt: string;
  updatedAt: string;
  stream?: MuxStream | null;
};

/**
 * Submission review request body
 */
export type SubmissionReviewRequest = {
  moderatorWallet: string;
  action: SubmissionReviewAction;
  notes?: string;
};

/**
 * Submission review API response
 */
export type SubmissionReviewResponse = {
  success: boolean;
  data: Submission;
  message?: string;
};

/**
 * Query parameters for the dares list API
 */
export type DaresListParams = {
  status?: DareStatus;
  creator?: string;
  limit?: number;
  cursor?: string;
  submissionStatus?: SubmissionStatus;
  includeDisabled?: boolean;
  includeExpired?: boolean;
};

/**
 * Complete dare request body
 */
export type CompleteDareRequest = {
  tokenMint: string;
  isSuccessful?: boolean;
  moderatorPublicKey?: string;
};

/**
 * Complete dare API response
 */
export type CompleteDareResponse = {
  success: boolean;
  transaction: string;
  message?: string;
  error?: string;
};

/**
 * Complete dare tokenless API response
 */
export type CompleteDareTokenlessResponse = {
  success: boolean;
  transaction?: string;
  dareStateAddress?: string;
  error?: string;
  message?: string;
};

/**
 * Fail dare by time request body
 * Provide exactly ONE of: tokenMint or dareStatePublicKey
 */
export type FailDareByTimeRequest = {
  moderatorPublicKey: string;
  tokenMint?: string;
  dareStatePublicKey?: string;
};

/**
 * Fail dare by time API response
 */
export type FailDareByTimeResponse = {
  success: boolean;
  transaction: string;
  dareStateAddress?: string;
  tokenMint?: string;
  message?: string;
  error?: string;
};

/**
 * Moderator initialization request body
 */
export type ModeratorInitRequestBody = {
  moderatorPublicKey: string;
};

/**
 * Moderator initialization API response
 */
export type ModeratorInitResponse = {
  success: boolean;
  transaction: string;
};

/**
 * Frontend approve/reject request body (used by components)
 */
export type ApproveRejectRequestBody = {
  tokenMint: string;
  moderatorPublicKey: string;
  isApproved: boolean;
};

/**
 * Backend API request body for moderation (sent to backend)
 */
export type ModerateAPIRequestBody = {
  tokenMint: string;
  isApproved: boolean;
  moderatorPublicKey: string;
};

/**
 * Backend API response for moderation
 */
export type ModerateAPIResponse = {
  success: boolean;
  transaction: string;
};

/**
 * Moderator status response when initialized
 */
export type ModeratorStatusInitialized = {
  message: "Moderator is initialized";
  isInitialized: true;
  isEnabled: boolean;
  moderatorAddress: string;
  moderatorConfigPDA: string;
};

/**
 * Moderator status response when not initialized
 */
export type ModeratorStatusNotInitialized = {
  message: "Moderator not initialized";
  isInitialized: false;
  moderatorAddress: string;
  moderatorConfigPDA: string;
};

/**
 * Union type for moderator status response
 */
export type ModeratorStatusResponse =
  | ModeratorStatusInitialized
  | ModeratorStatusNotInitialized;

/**
 * IPFS metadata structure for dare content
 */
export type DareIPFSMetadata = {
  title?: string;
  description?: string;
  properties: {
    rules?: string[];
  };
  image?: string;
  video?: string;
  [key: string]: any;
};

/**
 * Toggle featured request body
 */
export type ToggleFeaturedRequest = {
  tokenMint: string;
  isFeatured: boolean;
};

/**
 * Toggle featured API response
 */
export type ToggleFeaturedResponse = {
  success: boolean;
  message?: string;
  data?: DareItem;
};

/**
 * Toggle disabled request body
 */
export type ToggleDisabledRequest = {
  tokenMint: string;
  isDisabled: boolean;
};

/**
 * Toggle disabled API response
 */
export type ToggleDisabledResponse = {
  success: boolean;
  message?: string;
  data?: DareItem;
};

/**
 * Dare statistics data structure
 */
export type DareStatsData = {
  totalDares: number;
  activeDares: number;
  completedDares: number;
  unverifiedDares: number;
  totalPayoutLamports: string;
  totalPayoutSol: string;
  totalPayoutUsd: string | null;
  averagePayoutLamports: string;
  averagePayoutSol: string;
  averagePayoutUsd: string | null;
};

/**
 * Dare statistics API response
 */
export type DareStatsResponse = {
  success: boolean;
  data: DareStatsData;
  message?: string;
  error?: string;
};

/**
 * Mux recording data from backend
 */
export type BackendMuxRecording = {
  assetId?: string;
  playbackId?: string;
  playbackUrl?: string;
  duration?: number;
  recordedAt?: string;
  [key: string]: any;
};

/**
 * Stream data from backend (Mux + Livepeer)
 */
export type BackendStream = {
  muxId?: string;
  playbackId?: string;
  playerWallet?: string;
  slotIndex?: number;
  streamKey?: string;
  streamType?: string;
  active?: boolean;
  isActive?: boolean;
  status?: string;
  mux?: {
    id?: string;
    playbackId?: string;
  };
  livepeer?: {
    streamKey?: string;
  };
  recording?: BackendMuxRecording | null;
  [key: string]: any;
};

/**
 * Database dare data from backend
 */
export type BackendDbDare = {
  ipfsCid: string;
  hasActiveStream: boolean;
  streams: (BackendStream | null)[];
  attemptability?: string;
  isFeatured: boolean;
  isDisabled: boolean;
  [key: string]: any;
};

/**
 * Dare state object from backend
 */
export type BackendDareState = {
  creator: string;
  payoutAmount: string;
  dareStatus: DareStatus;
  tradeStatus: string;
  isTokenless: boolean;
  tokenProgram?: string;
  createdAt: string;
  isBlocked: boolean;
  tokenMint: string;
  submitters: (string | null)[];
  openTimestamp: string;
  openDuration: string;
  hasExpired: boolean;
  availableSlots: number;
  submissions: Submission[];
  dbDare: BackendDbDare;
};

/**
 * Dare state API response from backend
 */
export type DareStateBackendResponse = {
  success: boolean;
  dareState: BackendDareState;
  submissions: Submission[];
  message?: string;
  error?: string;
};

/**
 * Profile data for a wallet address
 */
export type ProfileData = {
  wallet: string;
  username: string | null;
  displayName: string | null;
  avatarCid: string | null;
  twitter: string | null;
};

/**
 * Profile batch request body
 */
export type ProfileBatchRequest = {
  wallets: string[];
};

/**
 * Profile batch API response
 */
export type ProfileBatchResponse = {
  success: boolean;
  data: ProfileData[];
  message?: string;
  error?: string;
};

/**
 * Notification types enum
 * Updated to match backend schema with granular recipient-specific types
 */
export type NotificationType =
  // Winner notifications
  | "WINNER_SELECTED_SUBMITTER"
  | "WINNER_SELECTED_CREATOR"
  // Submission approval notifications
  | "SUBMISSION_APPROVED_SUBMITTER"
  | "SUBMISSION_APPROVED_CREATOR"
  // Submission void notifications
  | "SUBMISSION_VOIDED_SUBMITTER"
  | "SUBMISSION_VOIDED_CREATOR"
  // Submission rejection notifications
  | "SUBMISSION_REJECTED_SUBMITTER"
  | "SUBMISSION_REJECTED_CREATOR"
  // Tokenless dare acceptance notifications
  | "TOKENLESS_DARE_ACCEPTED_PLAYER"
  | "TOKENLESS_DARE_ACCEPTED_CREATOR"
  // Tokenized dare acceptance notifications
  | "TOKENIZED_DARE_ACCEPTED_PLAYER"
  | "TOKENIZED_DARE_ACCEPTED_CREATOR"
  // Dare lifecycle notifications
  | "DARE_SUBMITTED"
  | "DARE_APPROVED"
  | "DARE_REJECTED"
  // Legacy types (backward compatibility)
  | "DARE_ACCEPTED"
  | "SUBMISSION_APPROVED"
  | "SUBMISSION_REJECTED"
  | "SUBMISSION_WINNER"
  | "DARE_COMPLETED"
  | "DARE_FAILED"
  | "DARE_WITHDRAWN"
  | "GENERAL_ALERT";

/**
 * Send notification request body
 */
export type SendNotificationRequest = {
  wallet: string;
  type: NotificationType;
  dareMint?: string;
  remarks?: string;
};

/**
 * Send notification API response
 */
export type SendNotificationResponse = {
  success: boolean;
  message?: string;
  error?: string;
};
