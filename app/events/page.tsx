"use client";
import { Api } from '../lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const invoiceId = searchParams.get('invoiceId') || '';
  const eventType = searchParams.get('type') || '';
  const after = searchParams.get('after') || '';

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setSyncing(false);
      try {
        const params = new URLSearchParams();
        if (invoiceId) params.set('invoiceId', invoiceId);
        if (eventType) params.set('type', eventType);
        if (after) params.set('after', after);
        
        const data = await Api.listEvents(params);
        setEvents(data);
        
        if (data.length === 0 && (invoiceId || eventType || after)) {
          setSyncing(true);
        }
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [invoiceId, eventType, after]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/events?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/events');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        {(invoiceId || eventType || after) && (
          <button
            onClick={clearFilters}
            className="text-sm text-white/60 hover:text-white underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-white/10 rounded bg-white/5">
        <div>
          <label className="block text-sm text-white/70 mb-1">Invoice ID</label>
          <input
            type="text"
            value={invoiceId}
            onChange={(e) => updateFilter('invoiceId', e.target.value)}
            placeholder="Filter by invoice..."
            className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm"
          >
            <option value="">All types</option>
            <option value="INVOICE_CREATED">Invoice Created</option>
            <option value="INVOICE_LISTED">Invoice Listed</option>
            <option value="INVESTMENT_MADE">Investment Made</option>
            <option value="INVOICE_FUNDED">Invoice Funded</option>
            <option value="INVOICE_PAID">Invoice Paid</option>
            <option value="FILE_UPLOADED">File Uploaded</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">After (ISO)</label>
          <input
            type="datetime-local"
            value={after ? new Date(after).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateFilter('after', e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <div className="text-white/60">Loading events...</div>
        </div>
      ) : syncing ? (
        <div className="text-center py-8 border border-amber-500/20 bg-amber-500/10 rounded">
          <div className="text-amber-300 mb-2">⏱️ Syncing Mirror…</div>
          <div className="text-sm text-amber-200/70">No events found with current filters. Mirror node may be catching up.</div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-white/60">No events found.</div>
      ) : (
        <div className="space-y-3">
          {events.map((e: any) => (
            <div key={e.id} className="border border-white/10 rounded p-4 bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                    {e.type}
                  </span>
                  {e.invoiceId && (
                    <button
                      onClick={() => updateFilter('invoiceId', e.invoiceId)}
                      className="text-xs text-white/60 hover:text-white underline"
                    >
                      #{e.invoiceId.slice(0, 8)}
                    </button>
                  )}
                </div>
                <div className="text-xs text-white/50">
                  {new Date(e.timestamp).toLocaleString()}
                </div>
              </div>
              <pre className="text-xs text-white/70 overflow-auto bg-black/20 p-2 rounded">
{JSON.stringify(e.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}