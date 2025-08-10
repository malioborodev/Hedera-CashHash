"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Api } from "../lib/api";
import { useWallet } from "../wallet/WalletProvider";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'LISTED' as string, risk: '' as string, sort: 'new' as string });
  const [investing, setInvesting] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState<string | null>(null);
  const { accountId } = useWallet();

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
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <div className="text-xs text-white/60">{listedCount} listed</div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-white/10 rounded bg-white/5">
        <div>
          <label className="block text-sm text-white/70 mb-1">Status</label>
          <select value={filters.status} onChange={e=>setFilters(f=>({...f, status: e.target.value}))} className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm">
            <option value="">All</option>
            <option value="LISTED">Listed</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Risk Score</label>
          <select value={filters.risk} onChange={e=>setFilters(f=>({...f, risk: e.target.value}))} className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm">
            <option value="">All</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Sort</label>
          <select value={filters.sort} onChange={e=>setFilters(f=>({...f, sort: e.target.value}))} className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm">
            <option value="new">Newest</option>
            <option value="yield">Highest Yield</option>
          </select>
        </div>
      </div>

      {!accountId && (
        <div className="border border-amber-500/20 bg-amber-500/10 text-amber-300 rounded p-3 text-sm">
          Connect HashPack to create or invest in invoices.
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-white/70">No invoices match filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inv) => (
            <div key={inv.id} className="group border border-white/10 rounded p-5 hover:border-emerald-500/40 bg-white/5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">{inv.currency} {inv.amount}</div>
                <div className="text-xs px-2 py-1 rounded bg-white/10">{inv.status}</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60 mb-3">
                {inv.nftId && <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">NFT {inv.nftId}</span>}
                {inv.ftId && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">FT {inv.ftId}</span>}
                {inv.fileId && <button onClick={()=>setShowFiles(inv.id)} className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:opacity-90">Files</button>}
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                <Metric label="Yield" value={`${(inv.yieldBps||0)/100}%`} />
                <Metric label="Tenor" value={`${inv.tenorDays||30}d`} />
                <Metric label="Risk" value={`${inv.riskScore||3}/5`} />
              </div>
              <Progress pct={inv.fundedPct || 0} />
              <div className="mt-4 flex items-center justify-between">
                <Link href={`/invoices/${inv.id}`} className="text-sm text-white/80 hover:underline">View details</Link>
                <div className="flex items-center gap-2">
                  {inv.status !== 'LISTED' && accountId && (
                    <button onClick={async()=>{
                      const updated = await Api.listInvoice(inv.id);
                      setInvoices(prev=>prev.map(x=>x.id===inv.id?updated:x));
                    }} className="px-3 py-1.5 rounded bg-indigo-500 hover:bg-indigo-600 text-white text-sm">List</button>
                  )}
                  <button disabled={!accountId || inv.status!=='LISTED'} onClick={()=>setInvesting(inv.id)} className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm">Invest</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {investing && (
        <InvestModal
          invoice={invoices.find(i=>i.id===investing)}
          onClose={()=>setInvesting(null)}
          onInvested={(invId, amount)=>{
            // optimistic: bump fundedPct up to a cap of 100
            setInvoices(prev=>prev.map(x=>x.id===invId?{...x, fundedPct: Math.min(100, (x.fundedPct||0) + (amount / (x.amount||1) * 100))}:x));
          }}
        />
      )}

      {showFiles && (
        <FilesModal
          invoiceId={showFiles}
          onClose={()=>setShowFiles(null)}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-white/90">{value}</div>
    </div>
  );
}

function Progress({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-white/10 rounded">
      <div className="h-2 rounded bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function InvestModal({ invoice, onClose, onInvested }: { invoice: any; onClose: ()=>void; onInvested: (id:string, amount:number)=>void }) {
  const { accountId } = useWallet();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  if (!invoice) return null;
  const can = !!accountId;

  const submit = async () => {
    if (!can) return;
    const value = parseFloat(amount || '0');
    if (!value || value <= 0) return;
    setBusy(true);
    try {
      await Api.invest(invoice.id, { investorId: accountId!, amount: value });
      onInvested(invoice.id, value);
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md border border-white/10 rounded bg-black p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Invest in Invoice</div>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <div className="text-sm text-white/70 mb-4">FT: {invoice.ftId || '—'} | Amount: {invoice.currency} {invoice.amount}</div>
        <div className="space-y-2">
          <label className="block text-sm">Amount</label>
          <input value={amount} onChange={(e)=>setAmount(e.target.value)} type="number" min={0} step="0.01" className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm" placeholder="1000" />
          <button disabled={!can || busy} onClick={submit} className="w-full px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">{busy? 'Processing…':'Confirm Investment'}</button>
        </div>
      </div>
    </div>
  );
}

function FilesModal({ invoiceId, onClose }: { invoiceId: string; onClose: ()=>void }) {
  const [meta, setMeta] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try {
        const m = await Api.listInvoiceFileMeta(invoiceId);
        setMeta(m);
      } catch (e) {
        setMeta(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg border border-white/10 rounded bg-black p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Invoice Documents</div>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        {loading ? (
          <div className="text-white/60">Loading…</div>
        ) : !meta ? (
          <div className="text-white/60">No file attached.</div>
        ) : (
          <div className="space-y-2 text-sm">
            <div><span className="text-white/60">Filename:</span> {meta.filename}</div>
            <div><span className="text-white/60">Type:</span> {meta.mimetype} · {(meta.size/1024).toFixed(1)} KB</div>
            <div className="break-all"><span className="text-white/60">sha256:</span> <code className="text-cyan-300">{meta.sha256}</code></div>
            <div className="break-all"><span className="text-white/60">fileId:</span> <code className="text-emerald-300">{meta.id}</code></div>
            <a href={`/api/invoices/${invoiceId}/file/download`} target="_blank" className="inline-block mt-2 px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:opacity-90">Download</a>
          </div>
        )}
      </div>
    </div>
  );
}