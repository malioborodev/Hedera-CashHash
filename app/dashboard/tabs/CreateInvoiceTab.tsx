"use client";
import { useState } from 'react';
import { Api, uploadInvoiceFile } from '../../lib/api';

interface CreateInvoiceTabProps {
  onInvoiceCreated: () => void;
}

export default function CreateInvoiceTab({ onInvoiceCreated }: CreateInvoiceTabProps) {
  const [sellerId, setSellerId] = useState('supplier.demo');
  const [amount, setAmount] = useState(1000);
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const invoice = await Api.createInvoice({ 
        sellerId, 
        amount: Number(amount), 
        currency, 
        dueDate 
      });
      
      if (file) {
        await uploadInvoiceFile(invoice.id, file);
      }
      
      setSuccess(`Invoice #${invoice.id.slice(0,8)} created successfully!`);
      
      // Reset form
      setSellerId('supplier.demo');
      setAmount(1000);
      setCurrency('USD');
      setDueDate('');
      setFile(null);
      
      // Refresh parent data
      onInvoiceCreated();
      
    } catch (e: any) {
      setError(e.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Create Invoice</h2>
        <p className="text-white/70 text-sm">
          Create a new invoice to list on the marketplace for funding.
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300">
          <div className="font-medium mb-1">Success!</div>
          <div className="text-sm">{success}</div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded text-red-300">
          <div className="font-medium mb-1">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Seller ID</label>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 focus:border-emerald-500 focus:outline-none transition" 
              value={sellerId} 
              onChange={e=>setSellerId(e.target.value)}
              placeholder="e.g., supplier.demo"
              required
            />
            <p className="text-xs text-white/60 mt-1">
              Your company or supplier identifier
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input 
              type="number" 
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 focus:border-emerald-500 focus:outline-none transition" 
              value={amount} 
              onChange={e=>setAmount(Number(e.target.value))}
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 focus:border-emerald-500 focus:outline-none transition" 
              value={currency} 
              onChange={e=>setCurrency(e.target.value)}
              required
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <input 
              type="date" 
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 focus:border-emerald-500 focus:outline-none transition" 
              value={dueDate} 
              onChange={e=>setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="text-xs text-white/60 mt-1">
              When payment is expected from the buyer
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Supporting Documents</label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition">
              <input 
                type="file" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-white/60 mb-2">📄</div>
                <div className="text-sm font-medium mb-1">
                  {file ? file.name : 'Click to upload invoice document'}
                </div>
                <div className="text-xs text-white/60">
                  PDF, DOC, DOCX, JPG, PNG (max 10MB)
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setSellerId('supplier.demo');
              setAmount(1000);
              setCurrency('USD');
              setDueDate('');
              setFile(null);
              setError(null);
              setSuccess(null);
            }}
            className="px-6 py-2 border border-white/20 rounded hover:bg-white/10 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium transition"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded">
        <h3 className="font-medium mb-2">💡 How it works</h3>
        <ul className="text-sm text-white/70 space-y-1">
          <li>• Your invoice will be listed on the marketplace for investors</li>
          <li>• Investors can fund your invoice in exchange for yield</li>
          <li>• Once fully funded, you receive the funds minus fees</li>
          <li>• When buyer pays, investors receive their returns automatically</li>
        </ul>
      </div>
    </div>
  );
}