"use client";
import Link from 'next/link';
import { WalletButton } from "../wallet/WalletButton";

export function Navbar() {
  return (
    <nav className="w-full sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold tracking-wide">CashHash</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/invoices" className="text-white/90 hover:text-white">Invoices</Link>
          <Link href="/events" className="text-white/90 hover:text-white">Events</Link>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}