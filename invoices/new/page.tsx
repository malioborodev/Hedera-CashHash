"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Api, uploadInvoiceFile } from '../../lib/api';

export default function NewInvoicePage() {
  const [sellerId, setSellerId] = useState('supplier.demo');
  const [amount, setAmount] = useState(1000);
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const invoice = await Api.createInvoice({ sellerId, amount: Number(amount), currency, dueDate });
      if (file) {
        await uploadInvoiceFile(invoice.id, file);
      }
      router.push(`/invoices/${invoice.id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Create Invoice</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Seller ID</label>
          <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2" value={sellerId} onChange={e=>setSellerId(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Amount</label>
            <input type="number" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Currency</label>
            <input className="w-full bg-white/5 border border-white/10 rounded px-3 py-2" value={currency} onChange={e=>setCurrency(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Due Date</label>
          <input type="date" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Invoice File (optional)</label>
          <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button disabled={loading} className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  );
}