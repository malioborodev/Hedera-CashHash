"use client";
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Api } from '../../lib/api';
import { useWallet } from '../../wallet/WalletProvider';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = useMemo(()=>String(params?.id||''),[params]);
  const [invoice, setInvoice] = useState<any|null>(null);
  const [investAmount, setInvestAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const { accountId } = useWallet();

  async function fetchInvoice() {
    try {
      const data = await Api.getInvoice(id);
      setInvoice(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load invoice');
    }
  }

  useEffect(()=>{ if(id) fetchInvoice(); },[id]);

  async function onInvest() {
    if (!accountId) {
      setError('Please connect HashPack first');
      return;
    }
    setLoading(true); setError(null);
    try {
      await Api.invest(id, { investorId: accountId, amount: Number(investAmount) });
      await fetchInvoice();
    } catch (e:any) {
      setError(e.message || 'Invest failed');
    } finally {
      setLoading(false);
    }
  }

  async function onList() {
    setLoading(true); setError(null);
    try {
      await fetch(`/api/invoices/${id}/list`); // noop
    } catch {}
  }

  if (!invoice) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoice {invoice.id}</h1>
          <div className="text-white/70 text-sm">Seller: {invoice.sellerId}</div>
        </div>
        <div className="text-xs px-2 py-1 rounded bg-white/10">{invoice.status}</div>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="border border-white/10 rounded p-4">
            <div className="text-white/90">{invoice.currency} {invoice.amount}</div>
            <div className="text-white/60 text-sm">Due: {invoice.dueDate || '-'}</div>
          </div>

          <div className="border border-white/10 rounded p-4">
            <div className="font-medium mb-2">Actions</div>
            <div className="flex gap-3">
              <button className="px-3 py-2 rounded bg-indigo-500 hover:bg-indigo-600" onClick={onList} disabled={loading}>List Invoice</button>
              <button className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600" onClick={onInvest} disabled={loading || !accountId}>Invest</button>
            </div>
            {!accountId && <div className="text-xs text-white/60 mt-2">Connect wallet to invest</div>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="border border-white/10 rounded p-4">
            <div className="font-medium mb-2">Invest</div>
            <div className="flex items-center gap-2">
              <input type="number" className="bg-white/5 border border-white/10 rounded px-3 py-2 w-full" value={investAmount} onChange={e=>setInvestAmount(Number(e.target.value))} />
              <button className="px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600" onClick={onInvest} disabled={loading || !accountId}>Go</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}