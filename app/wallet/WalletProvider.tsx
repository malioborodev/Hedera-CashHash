"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Client-only imports untuk menghindari SSR issue
const useHashConnect = () => {
  const [hc, setHc] = useState<any>(null);
  const [status, setStatus] = useState<string>("disconnected");
  const [pairing, setPairing] = useState<any>(null);

  useEffect(() => {
    let instance: any = null;

    // Lazy load HashConnect hanya di client
    const initHashConnect = async () => {
      try {
        const { HashConnect, HashConnectConnectionState } = await import("hashconnect");
        const { LedgerId } = await import("@hashgraph/sdk");
        
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        
        // Skip initialization if no valid project ID is provided
        if (!projectId || projectId === "demo") {
          console.warn("WalletConnect project ID not configured. Wallet connection disabled.");
          return;
        }
        const appMetadata = {
          name: "CashHash",
          description: "Receivable financing on Hedera",
          icons: ["https://hashpack.app/assets/img/hashpack-logo.png"],
          url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
        };
        
        // Initialize with debug mode disabled for production-like behavior
        instance = new HashConnect(LedgerId.TESTNET, projectId, appMetadata, false);
        setHc(instance);

        instance.connectionStatusChangeEvent.on((s: any) => setStatus(s));
        instance.pairingEvent.on((p: any) => setPairing(p));
        instance.disconnectionEvent.on(() => setPairing(null));

        await instance.init();
        console.log("HashConnect initialized successfully");
      } catch (e) {
        console.warn("HashConnect init failed", e);
        // Set a more user-friendly error state
        setStatus("initialization_failed");
      }
    };

    initHashConnect();

    return () => {
      instance?.closeModal();
    };
  }, []);

  return { hc, status, pairing };
};

export type WalletContextState = {
  status: string;
  accountId?: string;
  connect: () => Promise<void>;
  connectQR: () => Promise<void>;
  disconnect: () => void;
  signerFor: (accountId: string) => any;
  sendHbarDemo: (to: string, amountTinybar: number) => Promise<string | null>;
  configError?: string | null;
  isConnecting?: boolean;
};

const WalletContext = createContext<WalletContextState | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { hc, status, pairing } = useHashConnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const accountId = useMemo(() => {
    if (pairing?.accountIds?.length > 0) {
      return pairing.accountIds[0];
    }
    return undefined;
  }, [pairing]);

  const connectExtension = async () => {
    if (!hc) {
      setConfigError("Wallet connection not configured. Please check your WalletConnect project ID in environment variables.");
      return;
    }
    setIsConnecting(true);
    setConfigError(null);
    try {
      // Try direct extension connection first
      const isHashPackExtension = typeof window !== 'undefined' && (window as any).hashconnect;
      
      if (isHashPackExtension) {
        console.log('HashPack extension detected, attempting direct connection...');
        // Try to connect directly without modal
        await hc.connectToLocalWallet();
      } else {
        setConfigError("HashPack browser extension not found. Please install HashPack extension or use QR code method.");
      }
    } catch (e) {
      console.error("Extension connection failed:", e);
      setConfigError("Failed to connect to HashPack extension. Please try the QR code method.");
    } finally {
      setIsConnecting(false);
    }
  };

  const connectQR = async () => {
    if (!hc) {
      setConfigError("Wallet connection not configured. Please check your WalletConnect project ID in environment variables.");
      return;
    }
    setIsConnecting(true);
    setConfigError(null);
    try {
      await hc.openPairingModal();
    } catch (e) {
      console.error("QR connection failed:", e);
      setConfigError("Failed to open QR code modal. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const connect = connectExtension; // Default to extension method

  function disconnect() {
    if (!hc) return;
    try {
      hc.disconnect();
      setPairing(null);
    } catch (e) {
      console.error(e);
    }
  }

  function signerFor(accId: string) {
    if (!hc) return undefined;
    try {
      // Dynamic import for AccountId
      import("@hashgraph/sdk").then(({ AccountId }) => {
        return hc.getSigner(AccountId.fromString(accId));
      });
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  async function sendHbarDemo(to: string, amountTinybar: number) {
    if (!accountId) return null;
    const signer = signerFor(accountId);
    if (!signer) return null;
    try {
      const { AccountId, TransferTransaction, Hbar } = await import("@hashgraph/sdk");
      const tx = await new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(accountId), Hbar.fromTinybars(-Math.abs(amountTinybar)))
        .addHbarTransfer(AccountId.fromString(to), Hbar.fromTinybars(Math.abs(amountTinybar)))
        .freezeWithSigner(signer);
      const res = await tx.executeWithSigner(signer);
      return res?.transactionId?.toString() || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  const value: WalletContextState = {
    status,
    accountId,
    connect,
    connectQR,
    disconnect,
    signerFor,
    sendHbarDemo,
    configError,
    isConnecting,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}