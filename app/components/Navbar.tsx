"use client";
import Link from 'next/link';
import { useWallet } from "../wallet/WalletProvider";

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
          <Tab href="/marketplace">Marketplace</Tab>
          <Tab href="/create-invoice">Create Invoice</Tab>
          <Tab href="/portfolio">Portfolio</Tab>
          <Tab href="/buyer-ack">Buyer ACK</Tab>
          <Tab href="/attester">Attester</Tab>
          <Link href="/events" className="text-white/90 hover:text-white hover:underline underline-offset-4 decoration-white/40 transition-colors">Events</Link>
          <Tab href="/settings">Settings</Tab>
          {!accountId ? (
            <button onClick={connect} className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">Connect Wallet</button>
          ) : (
            <div className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">{accountId}</div>
          )}
        </div>
      </div>
    </nav>
  );
}