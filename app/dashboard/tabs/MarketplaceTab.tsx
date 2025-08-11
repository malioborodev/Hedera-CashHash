"use client";
import { useMemo, useState, useEffect } from 'react';
import { Api } from '../../lib/api';
import { useWallet } from '../../wallet/WalletProvider';

interface MarketplaceTabProps {
  invoices: any[];
  onInvestmentMade: () => void;
}

export default function MarketplaceTab({ invoices, onInvestmentMade }: MarketplaceTabProps) {
  const [filters, setFilters] = useState({ status: 'LISTED' as string, risk: '' as string, sort: 'new' as string });
  const [investing, setInvesting] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState<string | null>(null);
  const { accountId } = useWallet();

  const filtered = useMemo(() => {
    let items = [...invoices];
    if (filters.status) items = items.filter(i => i.status === filters.status);
    if (filters.risk) items = items.filter(i => (i.riskScore || '').toString() === filters.risk);
    if (filters.sort === 'new') items.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filters.sort === 'yield') items.sort((a,b)=> (b.yieldBps||0) - (a.yieldBps||0));
    return items;
  }, [invoices, filters]);

  const listedCount = invoices.filter(i=>i.status==='LISTED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Marketplace</h2>
        <div className="text-xs text-white/60">{listedCount} listed</div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-white/10 rounded bg-white/5">
        <div>
          <label className="block text-sm text-white/70 mb-1">Status</label>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f, status: e.target.value}))} className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm">
            <option value="">All</option>
            <option value="LISTED">Listed</option>
            <option value="FUNDED">Funded</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Risk Score</label>
          <select value={filters.risk} onChange={e=>setFilters(f=>({...f, risk: e.target.value}))} className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm">
            <option value="">All</option>
            <option value="1">Low (1)</option>
            <option value="2">Medium (2)</option>
            <option value="3">High (3)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Sort by</label>
          <select value={filters.sort} onChange={e=>setFilters(f=>({...f, sort: e.target.value}))} className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm">
            <option value="new">Newest</option>
            <option value="yield">Highest Yield</option>
          </select>
        </div>
      </div>

      {/* Invoice Grid */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            No invoices found matching your filters.
          </div>
        ) : (
          filtered.map((invoice) => (
            <div key={invoice.id} className="border border-white/10 rounded p-4 bg-white/5 hover:bg-white/10 transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">{invoice.sellerId}</div>
                  <div className="text-sm text-white/60">Invoice #{invoice.id.slice(0,8)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{invoice.amount} {invoice.currency}</div>
                  <div className="text-xs text-white/60">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Metric label="Status" value={invoice.status} />
                <Metric label="Risk" value={invoice.riskScore ? `${invoice.riskScore}/3` : 'N/A'} />
                <Metric label="Yield" value={invoice.yieldBps ? `${(invoice.yieldBps/100).toFixed(1)}%` : 'N/A'} />
                <Metric label="Funded" value={`${invoice.fundedPct || 0}%`} />
              </div>

              {invoice.fundedPct > 0 && (
                <div className="mb-4">
                  <Progress pct={invoice.fundedPct} />
                </div>
              )}

              <div className="flex items-center gap-2">
                {invoice.status === 'LISTED' && (
                  <button
                    onClick={() => setInvesting(invoice.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded text-sm font-medium transition"
                  >
                    Invest
                  </button>
                )}
                <button
                  onClick={() => setShowFiles(invoice.id)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm transition"
                >
                  View Files
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Investment Modal */}
      {investing && (
        <InvestModal
          invoice={invoices.find(i => i.id === investing)}
          onClose={() => setInvesting(null)}
          onInvested={(id, amount) => {
            setInvesting(null);
            onInvestmentMade();
          }}
        />
      )}

      {/* Files Modal */}
      {showFiles && (
        <FilesModal
          invoiceId={showFiles}
          onClose={() => setShowFiles(null)}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function Progress({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function InvestModal({ invoice, onClose, onInvested }: { invoice: any; onClose: ()=>void; onInvested: (id:string, amount:number)=>void }) {
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvest() {
    setError(null);
    setLoading(true);
    try {
      await Api.invest(invoice.id, amount);
      onInvested(invoice.id, amount);
    } catch (e: any) {
      setError(e.message || 'Investment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Invest in Invoice</h3>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between">
            <span className="text-white/70">Seller:</span>
            <span>{invoice.sellerId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Amount:</span>
            <span>{invoice.amount} {invoice.currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Yield:</span>
            <span>{invoice.yieldBps ? `${(invoice.yieldBps/100).toFixed(1)}%` : 'N/A'}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-white/70 mb-1">Investment Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full p-2 bg-black/20 border border-white/20 rounded"
            min="1"
            max={invoice.amount}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-white/20 rounded hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleInvest}
            disabled={loading || amount <= 0}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded transition"
          >
            {loading ? 'Investing...' : 'Invest'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilesModal({ invoiceId, onClose }: { invoiceId: string; onClose: ()=>void }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Api.listFiles(invoiceId).then(setFiles).finally(() => setLoading(false));
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-white/10 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Invoice Files</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4 text-white/60">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-4 text-white/60">No files uploaded</div>
        ) : (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">{file.filename}</span>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}