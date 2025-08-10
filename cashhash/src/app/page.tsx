import Image from "next/image";

import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">CashHash</h1>
        <p className="text-white/70">Trade receivable financing on Hedera. Upload invoice, list, and get funded by investors.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/invoices" className="block border border-white/10 rounded p-6 hover:border-emerald-500/40">
          <div className="text-lg font-medium">Invoices</div>
          <div className="text-white/60 text-sm">Create, list, and manage invoices</div>
        </Link>
        <Link href="/events" className="block border border-white/10 rounded p-6 hover:border-emerald-500/40">
          <div className="text-lg font-medium">Events</div>
          <div className="text-white/60 text-sm">See latest on-chain & system events</div>
        </Link>
      </div>
    </div>
  );
}
