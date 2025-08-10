"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Api } from "../lib/api";
import { useWallet } from "../wallet/WalletProvider";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { accountId, status } = useWallet();

  useEffect(() => {
    (async () => {
      try {
        const data = await Api.listInvoices();
        setInvoices(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link href="/invoices/new" className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600">New</Link>
      </div>

      {!accountId && (
        <div className="border border-amber-500/20 bg-amber-500/10 text-amber-300 rounded p-3 text-sm">
          Connect HashPack to create or invest in invoices.
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : invoices.length === 0 ? (
        <div className="text-white/70">No invoices yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="block border border-white/10 rounded p-5 hover:border-emerald-500/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{inv.currency} {inv.amount}</div>
                  <div className="text-xs text-white/60">Seller: {inv.sellerId}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-white/10">{inv.status}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}