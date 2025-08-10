"use client";
import Link from 'next/link';
import { WalletButton } from "../wallet/WalletButton";

export function Navbar() {
  return (
    <nav className="w-full sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-wide bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity">CashHash</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/invoices" className="text-white/90 hover:text-white hover:underline underline-offset-4 decoration-white/40 transition-colors">Invoices</Link>
          <Link href="/events" className="text-white/90 hover:text-white hover:underline underline-offset-4 decoration-white/40 transition-colors">Events</Link>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}