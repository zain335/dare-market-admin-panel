"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction, PublicKey } from "@solana/web3.js";
import { Button } from "@/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { Badge } from "@/components/shadcn/ui/badge";
import { ModeratorInitResponse, ModeratorStatusResponse } from "@/types";
import { useToast } from "@/components/shadcn/ui/use-toast";

/**
 * Moderator configuration page component
 * Handles moderator initialization and wallet integration
 */
type SigningStep =
  | "idle"
  | "owner-signing"
  | "moderator-signing"
  | "sending"
  | "success"
  | "error";

export default function ModeratorConfigPage() {
  const { publicKey, signTransaction, connected, disconnect } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [signingStep, setSigningStep] = useState<SigningStep>("idle");
  const [partiallySignedTransaction, setPartiallySignedTransaction] = useState<
    string | null
  >(null);
  const [targetModeratorKey, setTargetModeratorKey] = useState<string | null>(
    null
  );
  const [moderatorStatus, setModeratorStatus] = useState<ModeratorStatusResponse | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const { toast } = useToast();

  // Get owner wallet public key from environment
  const ownerWalletKey = process.env.NEXT_PUBLIC_OWNER_WALLET;

  /**
   * Check moderator initialization status
   */
  const checkModeratorStatus = useCallback(async (walletAddress: string): Promise<void> => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`/moderator/${walletAddress}/status`);
      
      if (!response.ok) {
        throw new Error("Failed to check moderator status");
      }

      const statusData: ModeratorStatusResponse = await response.json();
      setModeratorStatus(statusData);
    } catch (error) {
      console.error("Error checking moderator status:", error);
      toast({
        title: "Status Check Failed",
        description: "Unable to check moderator initialization status",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  }, [toast]);

  /**
   * Effect to check status when wallet connects
   */
  useEffect(() => {
    if (connected && publicKey) {
      checkModeratorStatus(publicKey.toString());
    } else {
      setModeratorStatus(null);
    }
  }, [connected, publicKey, checkModeratorStatus]);

  /**
   * Step 1: Start the process and check if owner wallet is connected
   */
  const startInitialization = async (): Promise<void> => {
    if (!ownerWalletKey) {
      toast({
        title: "Configuration Error",
        description: "Owner wallet not configured in environment variables",
        variant: "destructive",
      });
      return;
    }

    // Check if current wallet is the owner wallet
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (publicKey.toString() !== ownerWalletKey) {
      console.log(
        "Please connect the owner wallet first to sign the transaction"
      );
      toast({
        title: "Wrong Wallet Connected",
        description:
          "Please connect the owner wallet first to sign the transaction",
        variant: "destructive",
      });
      return;
    }

    // Prompt user to enter moderator wallet address
    const moderatorKey = prompt("Enter the moderator wallet public key:");
    if (!moderatorKey) {
      toast({
        title: "Input Required",
        description: "Moderator wallet address is required",
        variant: "destructive",
      });
      return;
    }

    try {
      new PublicKey(moderatorKey); // Validate the public key format
      setTargetModeratorKey(moderatorKey);
      await handleOwnerSigning(moderatorKey);
    } catch (error) {
      toast({
        title: "Invalid Format",
        description: "Invalid moderator wallet address format",
        variant: "destructive",
      });
    }
  };

  /**
   * Step 2: Owner wallet signs the transaction
   */
  const handleOwnerSigning = async (moderatorKey: string): Promise<void> => {
    setIsLoading(true);
    setSigningStep("owner-signing");

    try {
      // Call the backend API to get the initialization transaction
      const response = await fetch("/moderator/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moderatorPublicKey: moderatorKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to get initialization transaction"
        );
      }

      const data: ModeratorInitResponse = await response.json();

      if (!data.success) {
        throw new Error("Backend initialization failed");
      }

      console.log("Transaction data received:", data.transaction);

      // Create connection to Solana network
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://api.devnet.solana.com",
        "confirmed"
      );

      // Decode the transaction from base64
      let transaction: Transaction;
      try {
        const transactionBuffer = Buffer.from(data.transaction, "base64");
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
      transaction.feePayer = new PublicKey(moderatorKey); // Moderator will pay fees

      console.log("Owner wallet signing transaction...");

      // Sign the transaction with the owner wallet
      if (!signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }

      const ownerSignedTransaction = await signTransaction(transaction);
      console.log("Transaction signed by owner successfully");

      // Store the partially signed transaction
      const serializedTransaction = ownerSignedTransaction.serialize({
        requireAllSignatures: false,
      });
      const base64Transaction = serializedTransaction.toString("base64");
      setPartiallySignedTransaction(base64Transaction);

      // Move to next step
      setSigningStep("moderator-signing");
      toast({
        title: "Owner Signature Complete",
        description:
          "Now connect the moderator wallet to complete the process.",
      });
    } catch (error) {
      console.error("Error in owner signing:", error);
      setSigningStep("error");
      toast({
        title: "Owner Signing Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to sign with owner wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 3: Switch to moderator wallet and complete signing
   */
  const handleModeratorSigning = async (): Promise<void> => {
    if (!targetModeratorKey || !partiallySignedTransaction) {
      toast({
        title: "Missing Data",
        description: "Missing required data from previous step",
        variant: "destructive",
      });
      return;
    }

    // Check if current wallet is the moderator wallet
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect the moderator wallet",
        variant: "destructive",
      });
      return;
    }

    if (publicKey.toString() !== targetModeratorKey) {
      toast({
        title: "Wrong Wallet Connected",
        description: `Please connect the moderator wallet: ${targetModeratorKey}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSigningStep("sending");

    try {
      // Reconstruct the transaction from the stored data
      const transactionBuffer = Buffer.from(
        partiallySignedTransaction,
        "base64"
      );
      const transaction = Transaction.from(transactionBuffer);

      console.log("Moderator wallet signing transaction...");

      // Sign the transaction with the moderator wallet
      if (!signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }

      const fullySignedTransaction = await signTransaction(transaction);
      console.log("Transaction signed by moderator successfully");

      // Create connection to send the transaction
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://api.devnet.solana.com",
        "confirmed"
      );

      // Send the fully signed transaction to the network
      console.log("Sending transaction to network...");
      const signature = await connection.sendRawTransaction(
        fullySignedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }
      );

      console.log("Transaction sent, signature:", signature);

      // Confirm the transaction
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      setSigningStep("success");
      toast({
        title: "Success!",
        description: `Moderator initialized successfully! Transaction: ${signature}`,
      });

      // Reset state for next use
      setPartiallySignedTransaction(null);
      setTargetModeratorKey(null);

      // Refresh moderator status to show updated state
      if (publicKey) {
        setTimeout(() => checkModeratorStatus(publicKey.toString()), 2000);
      }
    } catch (error) {
      console.error("Error in moderator signing:", error);
      setSigningStep("error");
      toast({
        title: "Moderator Signing Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to complete moderator signing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset the process
   */
  const resetProcess = (): void => {
    setSigningStep("idle");
    setPartiallySignedTransaction(null);
    setTargetModeratorKey(null);
    setIsLoading(false);
  };

  /**
   * Legacy single wallet approach (kept for reference but not used)
   */
  const handleInitModeratorLegacy = async (): Promise<void> => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your Solana wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!signTransaction) {
      toast({
        title: "Wallet Not Supported",
        description: "Wallet does not support transaction signing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSigningStep("idle");

    try {
      // Call the backend API to get the initialization transaction
      const response = await fetch("/moderator/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moderatorPublicKey: publicKey.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initialize moderator");
      }

      const data: ModeratorInitResponse = await response.json();

      if (!data.success) {
        throw new Error("Backend initialization failed");
      }

      console.log("Transaction data received:", data.transaction);

      // Create connection to Solana network first
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://api.devnet.solana.com",
        "confirmed"
      );

      // Decode the transaction from base64
      let transaction: Transaction;
      try {
        const transactionBuffer = Buffer.from(data.transaction, "base64");
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

      console.log("Attempting to sign transaction...");

      // Sign the transaction with the connected wallet
      let signedTransaction: Transaction;
      try {
        signedTransaction = await signTransaction(transaction);
        console.log("Transaction signed successfully");
      } catch (signError) {
        console.error("Failed to sign transaction:", signError);
        const errorMessage =
          signError instanceof Error
            ? signError.message
            : "Unknown signing error";
        throw new Error(`Failed to sign transaction: ${errorMessage}`);
      }

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

      setSigningStep("success");
      toast({
        title: "Success!",
        description: `Moderator initialized successfully! Transaction: ${signature}`,
      });
    } catch (error) {
      console.error("Error initializing moderator:", error);
      setSigningStep("error");
      toast({
        title: "Initialization Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initialize moderator",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Moderator Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Initialize your moderator status on the Dare platform
          </p>
        </div>

        {/* Moderator Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isCheckingStatus && "Checking Status..."}
              {!isCheckingStatus && !moderatorStatus && "Connect Wallet"}
              {moderatorStatus?.isInitialized && "Moderator Initialized"}
              {moderatorStatus && !moderatorStatus.isInitialized && "Initialize Moderator"}
              
              {isCheckingStatus && (
                <Badge variant="secondary">Checking...</Badge>
              )}
              {moderatorStatus?.isInitialized && (
                <Badge variant="default">
                  {moderatorStatus.isEnabled ? "Active" : "Inactive"}
                </Badge>
              )}
              {moderatorStatus && !moderatorStatus.isInitialized && (
                <Badge variant="secondary">Not Initialized</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isCheckingStatus && "Checking moderator initialization status..."}
              {!isCheckingStatus && !moderatorStatus && "Connect your wallet to check moderator status"}
              {moderatorStatus?.isInitialized && "Your moderator is already set up and ready to use"}
              {moderatorStatus && !moderatorStatus.isInitialized && "Initialize your moderator to start using moderation features"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            {isCheckingStatus && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Checking moderator status...</p>
                </div>
              </div>
            )}

            {/* No Wallet Connected */}
            {!connected && !isCheckingStatus && (
              <Alert>
                <AlertDescription>
                  Please connect your Solana wallet to check moderator status.
                </AlertDescription>
              </Alert>
            )}

            {/* Moderator Already Initialized */}
            {moderatorStatus?.isInitialized && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {moderatorStatus.message}
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Status:</p>
                      <p className="text-xs text-muted-foreground">
                        {moderatorStatus.isEnabled ? "Active & Enabled" : "Initialized but Disabled"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Moderator Address:</p>
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {moderatorStatus.moderatorAddress}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Config PDA:</p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {moderatorStatus.moderatorConfigPDA}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p><strong>What this means:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                    <li>Your moderator account is fully set up and configured</li>
                    <li>You can now moderate dares on the platform</li>
                    <li>No further initialization is required</li>
                    {moderatorStatus.isEnabled && <li>Your moderator status is currently active</li>}
                    {!moderatorStatus.isEnabled && <li>Contact admin to enable your moderator status</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Moderator Not Initialized - Show Initialization UI */}
            {moderatorStatus && !moderatorStatus.isInitialized && (
              <div className="space-y-4">
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    {moderatorStatus.message}
                  </AlertDescription>
                </Alert>

                {/* Show the multi-step process */}
                {/* Step Indicators */}
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`flex flex-col items-center space-y-1 ${
                      signingStep === "owner-signing" ||
                      signingStep === "moderator-signing" ||
                      signingStep === "sending" ||
                      signingStep === "success"
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        signingStep === "owner-signing" ||
                        signingStep === "moderator-signing" ||
                        signingStep === "sending" ||
                        signingStep === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      1
                    </div>
                    <span className="text-xs">Owner Signs</span>
                  </div>
                  <div
                    className={`flex-1 h-px mx-2 ${
                      signingStep === "moderator-signing" ||
                      signingStep === "sending" ||
                      signingStep === "success"
                        ? "bg-green-300"
                        : "bg-muted"
                    }`}
                  />
                  <div
                    className={`flex flex-col items-center space-y-1 ${
                      signingStep === "moderator-signing" ||
                      signingStep === "sending" ||
                      signingStep === "success"
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        signingStep === "moderator-signing" ||
                        signingStep === "sending" ||
                        signingStep === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      2
                    </div>
                    <span className="text-xs">Moderator Signs</span>
                  </div>
                  <div
                    className={`flex-1 h-px mx-2 ${
                      signingStep === "success" ? "bg-green-300" : "bg-muted"
                    }`}
                  />
                  <div
                    className={`flex flex-col items-center space-y-1 ${
                      signingStep === "success"
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        signingStep === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      ✓
                    </div>
                    <span className="text-xs">Complete</span>
                  </div>
                </div>

                {/* Current Wallet Info */}
                {connected && publicKey && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      Connected Wallet:
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1 break-all">
                      {publicKey.toString()}
                    </p>
                    {ownerWalletKey && (
                      <p className="text-xs mt-2">
                        <span className="font-medium">Owner Wallet Expected:</span>{" "}
                        {ownerWalletKey}
                      </p>
                    )}
                    {targetModeratorKey && (
                      <p className="text-xs mt-1">
                        <span className="font-medium">
                          Moderator Wallet Target:
                        </span>{" "}
                        {targetModeratorKey}
                      </p>
                    )}
                  </div>
                )}

                {/* Status Messages */}
                {signingStep === "success" && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Moderator initialization completed successfully!
                    </AlertDescription>
                  </Alert>
                )}

                {signingStep === "error" && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      Failed to initialize moderator. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

                {signingStep === "moderator-signing" && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Owner signature complete! Please disconnect and connect the
                      moderator wallet to continue.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {signingStep === "idle" && (
                    <Button
                      onClick={startInitialization}
                      disabled={!connected || isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? "Starting..." : "Start Initialization Process"}
                    </Button>
                  )}

                  {signingStep === "moderator-signing" && (
                    <Button
                      onClick={handleModeratorSigning}
                      disabled={!connected || isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading
                        ? "Signing & Sending..."
                        : "Complete with Moderator Wallet"}
                    </Button>
                  )}

                  {signingStep === "error" && (
                    <Button
                      onClick={resetProcess}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Start New Process
                    </Button>
                  )}
                </div>

                {/* Instructions */}
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Multi-Wallet Signing Instructions:</strong>
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-foreground">
                        Step 1: Owner Wallet
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          Connect the owner wallet (
                          {ownerWalletKey
                            ? `${ownerWalletKey.slice(0, 8)}...`
                            : "Not configured"}
                          )
                        </li>
                        <li>Click &quot;Start Initialization Process&quot;</li>
                        <li>Enter the moderator wallet address when prompted</li>
                        <li>Sign the transaction with the owner wallet</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-foreground">
                        Step 2: Moderator Wallet
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Disconnect the owner wallet</li>
                        <li>Connect the moderator wallet</li>
                        <li>Click &quot;Complete with Moderator Wallet&quot;</li>
                        <li>Sign and send the transaction</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
