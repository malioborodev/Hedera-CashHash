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
        
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";
        const appMetadata = {
          name: "CashHash",
          description: "Receivable financing on Hedera",
          icons: ["https://hashpack.app/assets/img/hashpack-logo.png"],
          url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
        };
        
        instance = new HashConnect(LedgerId.TESTNET, projectId, appMetadata, true);
        setHc(instance);

        instance.connectionStatusChangeEvent.on((s: any) => setStatus(s));
        instance.pairingEvent.on((p: any) => setPairing(p));
        instance.disconnectionEvent.on(() => setPairing(null));

        await instance.init();
      } catch (e) {
        console.warn("HashConnect init failed", e);
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
  disconnect: () => void;
  signerFor: (accountId: string) => any;
  sendHbarDemo: (to: string, amountTinybar: number) => Promise<string | null>;
};

const WalletContext = createContext<WalletContextState | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { hc, status, pairing } = useHashConnect();

  const accountId = useMemo(() => pairing?.accountIds?.[0] || undefined, [pairing]);

  async function connect() {
    if (!hc) return;
    try {
      hc.openPairingModal({ themeMode: "dark" });
    } catch (e) {
      console.error(e);
    }
  }

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
    disconnect,
    signerFor,
    sendHbarDemo,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}