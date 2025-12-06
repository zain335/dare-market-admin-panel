"use client";

import React, { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export const SolanaProvider = ({ children }) => {
  const getNetworkFromEnv = () => {
    const envNetwork = process.env.NEXT_PUBLIC_NETWORK || "devnet";
    switch (envNetwork.toLowerCase()) {
      case "mainnet":
      case "mainnet-beta":
        return WalletAdapterNetwork.Mainnet;
      case "devnet":
        return WalletAdapterNetwork.Devnet;
      case "testnet":
        return WalletAdapterNetwork.Testnet;
      case "localnet":
        return "http://localhost:8899";
      default:
        return WalletAdapterNetwork.Devnet;
    }
  };

  const network = getNetworkFromEnv();
  const endpoint = useMemo(() => {
    if (network === "http://localhost:8899") {
      return network;
    }
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
