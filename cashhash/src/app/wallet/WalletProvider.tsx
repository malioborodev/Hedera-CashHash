"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { HashConnect, HashConnectConnectionState, SessionData } from "hashconnect";
import { LedgerId, AccountId, TransferTransaction, Hbar } from "@hashgraph/sdk";

export type WalletContextState = {
  status: HashConnectConnectionState;
  accountId?: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  signerFor: (accountId: string) => ReturnType<HashConnect["getSigner"]> | undefined;
  sendHbarDemo: (to: string, amountTinybar: number) => Promise<string | null>;
};

const WalletContext = createContext<WalletContextState | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [hc, setHc] = useState<HashConnect | null>(null);
  const [status, setStatus] = useState<HashConnectConnectionState>(HashConnectConnectionState.Disconnected);
  const [pairing, setPairing] = useState<SessionData | null>(null);

  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";
    const appMetadata = {
      name: "CashHash",
      description: "Receivable financing on Hedera",
      icons: ["https://hashpack.app/assets/img/hashpack-logo.png"],
      url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    };
    const instance = new HashConnect(LedgerId.TESTNET, projectId, appMetadata, true);
    setHc(instance);

    instance.connectionStatusChangeEvent.on((s) => setStatus(s));
    instance.pairingEvent.on((p) => setPairing(p));
    instance.disconnectionEvent.on(() => setPairing(null));

    (async () => {
      try {
        await instance.init();
      } catch (e) {
        console.warn("HashConnect init failed", e);
      }
    })();

    return () => {
      instance?.closeModal();
    };
  }, []);

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
      return hc.getSigner(AccountId.fromString(accId));
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