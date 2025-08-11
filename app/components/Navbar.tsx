"use client";
import Link from 'next/link';
import { useWallet } from "../wallet/WalletProvider";
import { NETWORK } from "../lib/config";

export function Navbar() {
  const { accountId, connect, connectQR, configError, isConnecting } = useWallet();

  return (
    <nav className="w-full sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-wide bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity">CashHash</Link>
        
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-white/90 hover:text-white hover:underline underline-offset-4 decoration-white/40 transition-colors">Landing</Link>
          {accountId && (
            <Link href="/dashboard" className="text-white/90 hover:text-white hover:underline underline-offset-4 decoration-white/40 transition-colors">Dashboard</Link>
          )}
          {/* Network badge */}
          <NetworkBadge />
          {!accountId ? (
            <div className="flex flex-col items-end gap-1">
              {configError ? (
                 <div className="flex items-center gap-2">
                   <span className="text-red-400 text-xs">{configError}</span>
                   <button onClick={connect} className="px-3 py-1.5 rounded bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-sm text-red-300">
                     Retry
                   </button>
                 </div>
               ) : isConnecting ? (
                 <div className="flex flex-col items-end gap-1">
                   <span className="text-blue-400 text-xs">Scan QR code with HashPack mobile app or use HashPack browser extension</span>
                   <button className="px-3 py-1.5 rounded bg-blue-500/20 border border-blue-500/30 text-sm text-blue-300" disabled>
                     Connecting...
                   </button>
                 </div>
               ) : (
                 <div className="flex gap-2">
                   <button 
                     onClick={connect} 
                     className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors text-sm"
                   >
                     Extension
                   </button>
                   <button 
                     onClick={connectQR} 
                     className="px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors text-sm"
                   >
                     QR Code
                   </button>
                 </div>
               )}
            </div>
          ) : (
            <div className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">{accountId}</div>
          )}
        </div>
      </div>
      <NetworkMismatchBanner />
    </nav>
  );
}

function NetworkBadge() {
  const label = NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet';
  const color = label === 'Mainnet' ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  return (
    <span className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${color}`} aria-label={`Network: ${label}`}>
      ● {label}
    </span>
  );
}

function NetworkMismatchBanner() {
  // WalletProvider currently pairs to LedgerId.TESTNET; show banner if env is mainnet while wallet connected
  const { accountId } = useWallet();
  const expectingMainnet = NETWORK === 'mainnet';
  const mismatch = accountId && expectingMainnet; // wallet (TESTNET) vs env (MAINNET)
  if (!mismatch) return null;
  return (
    <div role="alert" className="border-t border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs md:text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2">
        Network mismatch: Wallet on Testnet, App expects Mainnet. Please switch or refresh configuration.
      </div>
    </div>
  );
}