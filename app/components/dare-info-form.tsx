"use client";
import {
  DareItem,
  ModerateAPIResponse,
  Submission,
  SubmissionReviewResponse,
  CompleteDareResponse,
  CompleteDareTokenlessResponse,
  ToggleFeaturedResponse,
  ToggleDisabledResponse,
  FailDareByTimeResponse,
  DareStateBackendResponse,
} from "@/types";
import React, { useState, useEffect } from "react";
import DareInfo from "./dare-info";
import SubmissionReviewModal from "./submission-review-modal";
import { useToast } from "@/components/shadcn/ui/use-toast";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";
import { mapBackendDareStateToItem } from "@/utils/dare-mapping";
import { DARE_REFRESH_DELAY_MS } from "@/constants";
import { sendNotification } from "@/utils/notifications";

interface DareInfoFormProps {
  dare: DareItem;
  onUpdate?: (updatedDare: DareItem) => void;
}

/**
 * Form component for managing dare information and actions
 * Handles approve/reject operations for dares
 */
const DareInfoForm: React.FC<DareInfoFormProps> = ({ dare, onUpdate }) => {
  const [dareData, setDareData] = useState<DareItem>(dare);
  const [isLoading, setIsLoading] = useState(false);
  const [isFailingDare, setIsFailingDare] = useState(false);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);
  const [isTogglingDisabled, setIsTogglingDisabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [isReviewingSubmission, setIsReviewingSubmission] = useState(false);
  const [rejectingPendingWallet, setRejectingPendingWallet] = useState<
    string | null
  >(null);
  const { toast } = useToast();
  const { connected, publicKey, signTransaction } = useWallet();

  /**
   * Sync dareData when the dare prop changes
   * This ensures we always have the latest data including full submission stream/recording data
   */
  useEffect(() => {
    setDareData(dare);
  }, [dare]);

  /**
   * Fetch fresh dare state when component mounts
   * Ensures we always display the latest data when opening dare details
   */
  useEffect(() => {
    refreshDareState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  /**
   * Refresh dare state from backend API
   * Fetches latest dare data after operations to ensure UI is in sync
   */
  const refreshDareState = async () => {
    try {
      setIsRefreshing(true);

      const response = await axios.get<DareStateBackendResponse>(
        `/dare/get-state/${dareData.tokenMint}`
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to refresh dare state");
      }

      // Map backend response to DareItem format
      const updatedDare = mapBackendDareStateToItem(response.data);

      // Update local state
      setDareData(updatedDare);

      // Notify parent component
      onUpdate?.(updatedDare);

      console.log("[Dare Refresh] Successfully refreshed dare state");
    } catch (error) {
      console.error("[Dare Refresh] Error refreshing dare state:", error);
      toast({
        title: "Failed to Refresh",
        description:
          "Could not refresh dare details. The operation completed, but latest state couldn't be fetched.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handles dare approval operation with transaction signing
   * Gets transaction from backend and sends it via connected wallet
   */
  const handleApprove = async (tokenMint: string) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to approve the dare.",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction) {
      toast({
        title: "Wallet Error",
        description: "Your wallet does not support transaction signing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Call the moderation API to get the transaction
      const response = await axios.post<ModerateAPIResponse>(
        "/moderator/moderate",
        {
          tokenMint,
          moderatorPublicKey: publicKey.toString(),
          isApproved: true,
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to get transaction from backend");
      }

      console.log(
        "Transaction received from backend:",
        response.data.transaction
      );

      // Create connection to Solana network
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Decode the transaction from base64
      let transaction: Transaction;
      try {
        const transactionBuffer = Buffer.from(
          response.data.transaction,
          "base64"
        );
        transaction = Transaction.from(transactionBuffer);
        console.log("Transaction decoded successfully");
      } catch (decodeError) {
        console.error("Failed to decode transaction:", decodeError);
        throw new Error("Invalid transaction format received from server");
      }

      // Verify transaction is valid
      if (!transaction.instructions || transaction.instructions.length === 0) {
        throw new Error("Transaction contains no instructions");
      }

      // Get recent blockhash to ensure transaction is valid
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Signing transaction with wallet...");

      // Sign the transaction with the connected wallet
      const signedTransaction = await signTransaction(transaction);
      console.log("Transaction signed successfully");

      // Send the signed transaction to the network
      console.log("Sending transaction to network...");
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }
      );

      console.log("Transaction sent, signature:", signature);

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight: (
            await connection.getLatestBlockhash()
          ).lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      toast({
        title: "Success!",
        description: `Dare approved successfully! Transaction: ${signature}`,
      });

      // Send notification to dare creator
      sendNotification(
        dareData.creator,
        "DARE_APPROVED",
        dareData.tokenMint,
        `Your dare ${dareData.tokenMint} is now live.`
      ).catch((err) => {
        console.error("[Dare Approve] Failed to send notification:", err);
        // Don't show error to user - notifications are non-critical
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error approving dare:", error);
      toast({
        title: "Approval Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to approve dare. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles dare rejection operation with transaction signing
   * Gets transaction from backend and sends it via connected wallet
   */
  const handleReject = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to reject the dare.",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction) {
      toast({
        title: "Wallet Error",
        description: "Your wallet does not support transaction signing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Call the moderation API to get the transaction
      const response = await axios.post<ModerateAPIResponse>(
        "/moderator/moderate",
        {
          tokenMint: dareData.tokenMint,
          moderatorPublicKey: publicKey.toString(),
          isApproved: false,
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to get transaction from backend");
      }

      console.log(
        "Transaction received from backend:",
        response.data.transaction
      );

      // Create connection to Solana network
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Decode the transaction from base64
      let transaction: Transaction;
      try {
        const transactionBuffer = Buffer.from(
          response.data.transaction,
          "base64"
        );
        transaction = Transaction.from(transactionBuffer);
        console.log("Transaction decoded successfully");
      } catch (decodeError) {
        console.error("Failed to decode transaction:", decodeError);
        throw new Error("Invalid transaction format received from server");
      }

      // Verify transaction is valid
      if (!transaction.instructions || transaction.instructions.length === 0) {
        throw new Error("Transaction contains no instructions");
      }

      // Get recent blockhash to ensure transaction is valid
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Signing transaction with wallet...");

      // Sign the transaction with the connected wallet
      const signedTransaction = await signTransaction(transaction);
      console.log("Transaction signed successfully");

      // Send the signed transaction to the network
      console.log("Sending transaction to network...");
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }
      );

      console.log("Transaction sent, signature:", signature);

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight: (
            await connection.getLatestBlockhash()
          ).lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      toast({
        title: "Success!",
        description: `Dare rejected successfully! Transaction: ${signature}`,
      });

      // Send notification to dare creator
      sendNotification(
        dareData.creator,
        "DARE_REJECTED",
        dareData.tokenMint,
        `Your dare ${dareData.tokenMint} was rejected.`
      ).catch((err) => {
        console.error("[Dare Reject] Failed to send notification:", err);
        // Don't show error to user - notifications are non-critical
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error rejecting dare:", error);
      toast({
        title: "Rejection Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reject dare. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles toggling dare featured status
   * Calls backend API to update featured status
   * Backend endpoint: POST /api/featured/:dareMint
   */
  const handleToggleFeatured = async () => {
    try {
      setIsTogglingFeatured(true);

      const newFeaturedStatus = !dareData.isFeatured;

      // Call the toggle-featured API
      // This will forward to backend: POST /api/featured/:dareMint
      const response = await axios.post<ToggleFeaturedResponse>(
        "/moderator/toggle-featured",
        {
          tokenMint: dareData.tokenMint,
          isFeatured: newFeaturedStatus,
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to toggle featured status"
        );
      }

      toast({
        title: "Success!",
        description: `Dare ${newFeaturedStatus ? "featured" : "unfeatured"
          } successfully!`,
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast({
        title: "Operation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to toggle featured status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFeatured(false);
    }
  };

  /**
   * Handles toggling dare disabled status
   * Calls backend API to update disabled status
   * Backend endpoint: POST /api/dares/disabled/:dareMint
   */
  const handleToggleDisabled = async () => {
    try {
      setIsTogglingDisabled(true);

      const newDisabledStatus = !(dareData.isDisabled || false);

      // Call the toggle-disabled API
      // This will forward to backend: POST /api/dares/disabled/:dareMint
      const response = await axios.post<ToggleDisabledResponse>(
        "/moderator/toggle-disabled",
        {
          tokenMint: dareData.tokenMint,
          isDisabled: newDisabledStatus,
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to toggle disabled status"
        );
      }

      toast({
        title: "Success!",
        description: `Dare ${newDisabledStatus ? "disabled" : "enabled"
          } successfully!`,
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error toggling disabled status:", error);
      toast({
        title: "Operation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to toggle disabled status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingDisabled(false);
    }
  };

  /**
   * Handle viewing a submission
   */
  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  /**
   * Handle voiding a submission (blockchain transaction + API)
   * Two-step process:
   * 1. First complete the dare with isSuccessful: false (get transaction, sign, and send)
   * 2. After transaction confirmation, call the review API to mark submission as rejected
   */
  const handleVoidSubmission = async (submissionId: string, notes?: string) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to review submissions.",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction) {
      toast({
        title: "Wallet Error",
        description: "Your wallet does not support transaction signing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsReviewingSubmission(true);

      // Find the submission to get the submitter wallet (player)
      const submission = dareData.submissions?.find(
        (sub) => sub?.id === submissionId
      );
      if (!submission || !submission.submitterWallet) {
        throw new Error("Submission not found or missing submitter wallet");
      }

      // Step 1: Complete the dare with isSuccessful: false
      const isTokenless = dareData.isTokenless || false;
      const endpoint = isTokenless
        ? "/moderator/complete-dare-tokenless"
        : "/moderator/complete-dare";

      // Build request body based on dare type
      const requestBody = isTokenless
        ? {
          dareStatePublicKey: dareData.tokenMint,
          player: submission.submitterWallet,
          isSuccessful: false,
          moderatorPublicKey: publicKey.toString(),
        }
        : {
          tokenMint: dareData.tokenMint,
          isSuccessful: false,
          moderatorPublicKey: publicKey.toString(),
        };

      // Validate required fields for tokenless dares
      if (isTokenless && !dareData.tokenMint) {
        throw new Error(
          "Dare state public key is required for tokenless dares"
        );
      }

      // Call the complete-dare API to get the transaction
      const completeResponse = await axios.post<
        CompleteDareResponse | CompleteDareTokenlessResponse
      >(endpoint, requestBody);

      if (!completeResponse.data.success) {
        throw new Error(
          completeResponse.data.message ||
          completeResponse.data.error ||
          "Failed to get transaction from backend"
        );
      }

      if (!completeResponse.data.transaction) {
        throw new Error("No transaction received from backend");
      }

      console.log(
        "Transaction received from backend:",
        completeResponse.data.transaction
      );

      // Create connection to Solana network
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Decode the transaction from base64
      let transaction: Transaction;
      try {
        const transactionBuffer = Buffer.from(
          completeResponse.data.transaction,
          "base64"
        );
        transaction = Transaction.from(transactionBuffer);
        console.log("Transaction decoded successfully");
      } catch (decodeError) {
        console.error("Failed to decode transaction:", decodeError);
        throw new Error("Invalid transaction format received from server");
      }

      // Verify transaction is valid
      if (!transaction.instructions || transaction.instructions.length === 0) {
        throw new Error("Transaction contains no instructions");
      }

      // Get recent blockhash to ensure transaction is valid
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Signing transaction with wallet...");

      // Sign the transaction with the connected wallet
      const signedTransaction = await signTransaction(transaction);
      console.log("Transaction signed successfully");

      // Send the signed transaction to the network
      console.log("Sending transaction to network...");
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }
      );

      console.log("Transaction sent, signature:", signature);

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight: (
            await connection.getLatestBlockhash()
          ).lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      console.log(
        "Transaction confirmed successfully, proceeding to review API"
      );

      // Step 2: After successful transaction, call the review API
      const reviewResponse = await axios.post<SubmissionReviewResponse>(
        `/moderator/submissions/${submissionId}/review`,
        {
          moderatorWallet: publicKey.toString(),
          action: "REJECT",
          notes: notes || undefined,
        }
      );

      if (!reviewResponse.data.success) {
        throw new Error(
          reviewResponse.data.message || "Failed to reject submission"
        );
      }

      // Update the submission in the dare data
      const updatedSubmissions = dareData.submissions
        ?.map((sub) =>
          sub && sub.id === submissionId ? reviewResponse.data.data : sub
        )
        .filter((sub) => sub != null);

      setShowSubmissionModal(false);

      toast({
        title: "Success!",
        description: `Submission voided successfully! Transaction: ${signature}`,
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error voiding submission:", error);
      toast({
        title: "Void Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to void submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReviewingSubmission(false);
    }
  };

  /**
   * Handle rejecting a submission (API only, no blockchain transaction)
   * Only calls the review API to mark submission as rejected
   */
  const handleRejectSubmission = async (
    submissionId: string,
    notes?: string
  ) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to review submissions.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsReviewingSubmission(true);

      // Call the review API to mark as rejected (API only, no blockchain)
      const response = await axios.post<SubmissionReviewResponse>(
        `/moderator/submissions/${submissionId}/review`,
        {
          moderatorWallet: publicKey.toString(),
          action: "REJECT",
          notes: notes || undefined,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to reject submission");
      }

      // Update the submission in the dare data
      setShowSubmissionModal(false);

      toast({
        title: "Success!",
        description: "Submission rejected successfully.",
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast({
        title: "Rejection Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reject submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReviewingSubmission(false);
    }
  };

  /**
   * Handle rejecting a pending submission (submitter without submission record)
   * Calls complete-dare API with isSuccessful: false, signs transaction, and sends to Solana
   */
  const handleRejectPendingSubmission = async (submitterWallet: string) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description:
          "Please connect your wallet to reject pending submissions.",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction) {
      toast({
        title: "Wallet Error",
        description: "Your wallet does not support transaction signing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setRejectingPendingWallet(submitterWallet);

      // Determine endpoint and request body based on dare type
      const isTokenless = dareData.isTokenless || false;
      const endpoint = isTokenless
        ? "/moderator/complete-dare-tokenless"
        : "/moderator/complete-dare";

      // Build request body based on dare type with isSuccessful: false
      // For tokenless dares, include the player (submitter wallet)
      const requestBody = isTokenless
        ? {
          dareStatePublicKey: dareData.tokenMint,
          player: submitterWallet,
          isSuccessful: false,
          moderatorPublicKey: publicKey.toString(),
        }
        : {
          tokenMint: dareData.tokenMint,
          isSuccessful: false,
          moderatorPublicKey: publicKey.toString(),
        };

      // Validate required fields for tokenless dares
      if (isTokenless && !dareData.tokenMint) {
        throw new Error(
          "Dare state public key is required for tokenless dares"
        );
      }

      // Call the complete-dare API to get the transaction
      const completeResponse = await axios.post<
        CompleteDareResponse | CompleteDareTokenlessResponse
      >(endpoint, requestBody);

      if (!completeResponse.data.success) {
        throw new Error(
          completeResponse.data.message ||
          completeResponse.data.error ||
          "Failed to get transaction from backend"
        );
      }

      if (!completeResponse.data.transaction) {
        throw new Error("No transaction received from backend");
      }

      console.log(
        "Transaction received from backend:",
        completeResponse.data.transaction
      );

      // Create connection to Solana network
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Decode the transaction from base64
      let transaction: Transaction;
      try {
        const transactionBuffer = Buffer.from(
          completeResponse.data.transaction,
          "base64"
        );
        transaction = Transaction.from(transactionBuffer);
        console.log("Transaction decoded successfully");
      } catch (decodeError) {
        console.error("Failed to decode transaction:", decodeError);
        throw new Error("Invalid transaction format received from server");
      }

      // Verify transaction is valid
      if (!transaction.instructions || transaction.instructions.length === 0) {
        throw new Error("Transaction contains no instructions");
      }

      // Get recent blockhash to ensure transaction is valid
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Signing transaction with wallet...");

      // Sign the transaction with the connected wallet
      const signedTransaction = await signTransaction(transaction);
      console.log("Transaction signed successfully");

      // Send the signed transaction to the network
      console.log("Sending transaction to network...");
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }
      );

      console.log("Transaction sent, signature:", signature);

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight: (
            await connection.getLatestBlockhash()
          ).lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      toast({
        title: "Success!",
        description: `Pending submission rejected successfully! Transaction: ${signature}`,
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error rejecting pending submission:", error);
      toast({
        title: "Rejection Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reject pending submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRejectingPendingWallet(null);
    }
  };

  /**
   * Handle marking a submission as winner
   * For tokenless dares, this should complete the dare with isSuccessful: true
   * and the winner as the player
   */
  const handleWinnerSubmission = async (
    submissionId: string,
    notes?: string
  ) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to review submissions.",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction && dareData.isTokenless) {
      toast({
        title: "Wallet Error",
        description: "Your wallet does not support transaction signing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsReviewingSubmission(true);

      // Find the submission to get the submitter wallet (player)
      const submission = dareData.submissions?.find(
        (sub) => sub?.id === submissionId
      );
      if (!submission || !submission.submitterWallet) {
        throw new Error("Submission not found or missing submitter wallet");
      }

      // For tokenless dares, complete the dare first with the winner as player
      const isTokenless = dareData.isTokenless || false;

      if (isTokenless) {
        // Ensure signTransaction is available for tokenless dares
        if (!signTransaction) {
          throw new Error("Wallet does not support transaction signing");
        }

        // Build request body for tokenless dare completion
        const requestBody = {
          dareStatePublicKey: dareData.tokenMint,
          player: submission.submitterWallet,
          isSuccessful: true,
          moderatorPublicKey: publicKey.toString(),
        };

        // Validate required fields
        if (!dareData.tokenMint) {
          throw new Error(
            "Dare state public key is required for tokenless dares"
          );
        }

        // Call the complete-dare-tokenless API to get the transaction
        const completeResponse =
          await axios.post<CompleteDareTokenlessResponse>(
            "/moderator/complete-dare-tokenless",
            requestBody
          );

        if (!completeResponse.data.success) {
          throw new Error(
            completeResponse.data.message ||
            completeResponse.data.error ||
            "Failed to get transaction from backend"
          );
        }

        if (!completeResponse.data.transaction) {
          throw new Error("No transaction received from backend");
        }

        console.log(
          "Transaction received from backend:",
          completeResponse.data.transaction
        );

        // Create connection to Solana network
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://api.devnet.solana.com",
          "confirmed"
        );

        // Decode the transaction from base64
        let transaction: Transaction;
        try {
          const transactionBuffer = Buffer.from(
            completeResponse.data.transaction,
            "base64"
          );
          transaction = Transaction.from(transactionBuffer);
          console.log("Transaction decoded successfully");
        } catch (decodeError) {
          console.error("Failed to decode transaction:", decodeError);
          throw new Error("Invalid transaction format received from server");
        }

        // Verify transaction is valid
        if (
          !transaction.instructions ||
          transaction.instructions.length === 0
        ) {
          throw new Error("Transaction contains no instructions");
        }

        // Get recent blockhash to ensure transaction is valid
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        console.log("Signing transaction with wallet...");

        // Sign the transaction with the connected wallet
        const signedTransaction = await signTransaction(transaction);
        console.log("Transaction signed successfully");

        // Send the signed transaction to the network
        console.log("Sending transaction to network...");
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: "confirmed",
            maxRetries: 3,
          }
        );

        console.log("Transaction sent, signature:", signature);

        // Confirm the transaction
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight: (
              await connection.getLatestBlockhash()
            ).lastValidBlockHeight,
          },
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error(
            `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
          );
        }

        console.log(
          "Transaction confirmed successfully, proceeding to review API"
        );
      }

      // Now call the review API to mark as winner
      const response = await axios.post<SubmissionReviewResponse>(
        `/moderator/submissions/${submissionId}/review`,
        {
          moderatorWallet: publicKey.toString(),
          action: "SELECT_WINNER",
          notes: notes || undefined,
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to mark submission as winner"
        );
      }

      // Update the submission in the dare data
      const updatedSubmissions = dareData.submissions
        ?.map((sub) =>
          sub && sub.id === submissionId ? response.data.data : sub
        )
        .filter((sub) => sub != null);

      setShowSubmissionModal(false);

      toast({
        title: "Success!",
        description: "Submission marked as winner successfully.",
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error marking submission as winner:", error);
      toast({
        title: "Operation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to mark submission as winner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReviewingSubmission(false);
    }
  };

  /**
   * Handle failing a dare by time expiration with transaction signing
   * Gets transaction from backend and sends it via connected wallet
   */
  const handleFailDareByTime = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to fail the dare.",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction) {
      toast({
        title: "Wallet Error",
        description: "Your wallet does not support transaction signing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsFailingDare(true);

      // Determine endpoint and request body based on dare type
      const isTokenless = dareData.isTokenless || false;

      // Build request body based on dare type
      const requestBody = isTokenless
        ? {
          dareStatePublicKey: dareData.tokenMint,
          moderatorPublicKey: publicKey.toString(),
        }
        : {
          tokenMint: dareData.tokenMint,
          moderatorPublicKey: publicKey.toString(),
        };

      console.log({ dareData, isTokenless, requestBody });

      // Validate required fields for tokenless dares
      if (isTokenless && !dareData.tokenMint) {
        throw new Error(
          "Dare state public key is required for tokenless dares"
        );
      }

      // Call the fail-dare-by-time API endpoint
      const response = await axios.post<FailDareByTimeResponse>(
        "/moderator/fail-dare-by-time",
        requestBody
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
          response.data.error ||
          "Failed to get transaction from backend"
        );
      }

      if (!response.data.transaction) {
        throw new Error("No transaction received from backend");
      }

      console.log(
        "Transaction received from backend:",
        response.data.transaction
      );

      // Create connection to Solana network
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Decode the transaction from base64
      let transaction: Transaction;
      try {
        const transactionBuffer = Buffer.from(
          response.data.transaction,
          "base64"
        );
        transaction = Transaction.from(transactionBuffer);
        console.log("Transaction decoded successfully");
      } catch (decodeError) {
        console.error("Failed to decode transaction:", decodeError);
        throw new Error("Invalid transaction format received from server");
      }

      // Verify transaction is valid
      if (!transaction.instructions || transaction.instructions.length === 0) {
        throw new Error("Transaction contains no instructions");
      }

      // Get recent blockhash to ensure transaction is valid
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Signing transaction with wallet...");

      // Sign the transaction with the connected wallet
      const signedTransaction = await signTransaction(transaction);
      console.log("Transaction signed successfully");

      // Send the signed transaction to the network
      console.log("Sending transaction to network...");
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }
      );

      console.log("Transaction sent, signature:", signature);

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight: (
            await connection.getLatestBlockhash()
          ).lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      toast({
        title: "Success!",
        description: `Dare failed successfully! Transaction: ${signature}`,
      });

      // Send notification to dare creator
      sendNotification(
        dareData.creator,
        "DARE_FAILED",
        dareData.tokenMint,
        "Your dare expired without successful completion"
      ).catch((err) => {
        console.error("[Dare Fail] Failed to send notification:", err);
        // Don't show error to user - notifications are non-critical
      });

      // Wait for backend to process, then refresh dare state
      await new Promise((resolve) =>
        setTimeout(resolve, DARE_REFRESH_DELAY_MS)
      );
      await refreshDareState();
    } catch (error) {
      console.error("Error failing dare:", error);
      toast({
        title: "Failed to Fail Dare",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fail dare. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFailingDare(false);
    }
  };

  return (
    <div className="w-full">
      <DareInfo
        dare={dareData}
        onApprove={() => handleApprove(dareData.tokenMint)}
        onReject={handleReject}
        onFailDareByTime={handleFailDareByTime}
        onToggleFeatured={handleToggleFeatured}
        onToggleDisabled={handleToggleDisabled}
        isLoading={isLoading}
        isFailingDare={isFailingDare}
        isTogglingFeatured={isTogglingFeatured}
        isTogglingDisabled={isTogglingDisabled}
        isRefreshing={isRefreshing}
        onViewSubmission={handleViewSubmission}
        onRejectPendingSubmission={handleRejectPendingSubmission}
        rejectingPendingWallet={rejectingPendingWallet}
      />
      <SubmissionReviewModal
        submission={selectedSubmission}
        dareData={dareData}
        open={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        onVoid={handleVoidSubmission}
        onReject={handleRejectSubmission}
        onWinner={handleWinnerSubmission}
        isLoading={isReviewingSubmission}
      />
    </div>
  );
};

export default DareInfoForm;
