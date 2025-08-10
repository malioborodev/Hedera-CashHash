"use client";
import { useEffect, useState } from "react";
import { useWallet } from "../wallet/WalletProvider";
import { Api } from "../lib/api";
import Link from "next/link";

export default function PortfolioPage() {
  const { accountId } = useWallet();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!accountId) {
        setLoading(false);
        return;
      }
      try {
        const allInvoices = await Api.listInvoices();
        const userInvoices = allInvoices.filter((inv: any) => 
          inv.sellerId === accountId ||
          inv.ftId || // any invoice with tokenization (investable)
          inv.fundedPct > 0 ||
          inv.status === 'FUNDED' || inv.status === 'PAID'
        );
        setInvoices(userInvoices);

        const allEvents = await Api.listEvents(new URLSearchParams());
        const userEvents = allEvents.filter((e: any) => 
          userInvoices.find((inv: any) => inv.id === e.invoiceId) ||
          e.payload?.investorId === accountId
        );
        setEvents(userEvents.slice(0, 10));
      } catch (e) {
        console.warn('Portfolio data fetch failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [accountId]);

  if (!accountId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <div className="border border-amber-500/20 bg-amber-500/10 text-amber-300 rounded p-4">
          <div className="font-medium mb-2">Connect Wallet Required</div>
          <div className="text-sm">Please connect your HashPack wallet to view your portfolio.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <div className="text-xs px-2 py-1 rounded bg-white/10">{accountId}</div>
      </div>

      {loading ? (
        <div>Loading portfolio...</div>
      ) : (
        <>
          {/* My Invoices */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium">My Invoices</h2>
            {invoices.length === 0 ? (
              <div className="border border-white/10 rounded p-4 text-white/70">
                No invoices found. <Link href="/invoices/new" className="text-emerald-400 hover:underline">Create your first invoice</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoices.map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="block border border-white/10 rounded p-4 hover:border-emerald-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{inv.currency} {inv.amount}</div>
                      <div className="text-xs px-2 py-1 rounded bg-white/10">{inv.status}</div>
                    </div>
                    <div className="text-xs text-white/60 flex gap-2">
                      {inv.sellerId === accountId && <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">Exporter</span>}
                      {inv.fundedPct > 0 && <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">Invested {inv.fundedPct}%</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Recent Activity</h2>
            {events.length === 0 ? (
              <div className="border border-white/10 rounded p-4 text-white/70">
                No recent activity.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <div key={e.id} className="border border-white/10 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-mono text-sm">{e.type}</div>
                      <div className="text-xs text-white/60">{new Date(e.timestamp).toLocaleDateString()}</div>
                    </div>
                    {e.invoiceId && (
                      <Link href={`/invoices/${e.invoiceId}`} className="text-xs text-emerald-400 hover:underline">
                        Invoice {e.invoiceId}
                      </Link>
                    )}
                  </div>
                ))}
                <Link href="/events" className="block text-center text-sm text-white/70 hover:text-white">
                  View all events →
                </Link>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/invoices/new" className="border border-white/10 rounded p-3 hover:border-emerald-500/40 text-center">
                <div className="text-sm font-medium">Create Invoice</div>
                <div className="text-xs text-white/60">List new receivable</div>
              </Link>
              <Link href="/marketplace" className="border border-white/10 rounded p-3 hover:border-emerald-500/40 text-center">
                <div className="text-sm font-medium">Browse Market</div>
                <div className="text-xs text-white/60">Find investments</div>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}