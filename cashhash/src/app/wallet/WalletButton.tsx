"use client";
import React from "react";
import { useWallet } from "./WalletProvider";
import { HashConnectConnectionState } from "hashconnect";

export function WalletButton() {
  const { status, accountId, connect, disconnect } = useWallet();

  if (status === HashConnectConnectionState.Connected && accountId) {
    const short = accountId.length > 10 ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : accountId;
    return (
      <button onClick={disconnect} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10">
        {short}
      </button>
    );
  }

  return (
    <button onClick={connect} className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600">
      Connect HashPack
    </button>
  );
}