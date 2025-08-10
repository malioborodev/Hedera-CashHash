"use client";
import Link from 'next/link';
import { useWallet } from "../wallet/WalletProvider";
import { NETWORK } from "../lib/config";

export function Navbar() {
  const { accountId, connect } = useWallet();
  const disabled = !accountId;

  const Tab = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      className={`text-white/90 hover:text-white hover:underline underline-offset-4 decoration-white/40 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      prefetch={false}
    >
      {children}
    </Link>
  );

  return (
    <nav className="w-full sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-wide bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity">CashHash</Link>
        
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-white/90 hover:text-white hover:underline underline-offset-4 decoration-white/40 transition-colors">Landing</Link>
          {/* Dashboard tabs */}
          <Tab href="/marketplace">Market</Tab>
          <Tab href="/create-invoice">Create</Tab>
          <Tab href="/portfolio">Portfolio</Tab>
          <Tab href="/events">Events</Tab>
          {/* Network badge */}
          <NetworkBadge />
          {!accountId ? (
            <button onClick={connect} className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">Connect Wallet</button>
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