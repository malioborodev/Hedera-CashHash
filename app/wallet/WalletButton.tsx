"use client";
import { useWallet } from "./WalletProvider";
import React from "react";

export function WalletButton() {
  const { status, accountId, connect, disconnect } = useWallet();

  const connected = accountId && status && (String(status).toLowerCase() === "connected" || String(status) === "2");

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white/70 text-xs">{accountId}</span>
        <button className="px-3 py-1.5 rounded border border-white/10 hover:border-white/20 text-sm" onClick={disconnect}>Disconnect</button>
      </div>
    );
  }
  return (
    <button onClick={connect} className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-sm">Connect HashPack</button>
  );
}