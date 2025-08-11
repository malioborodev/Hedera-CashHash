"use client";
import { useState, useMemo } from 'react';
import { Api } from '../../lib/api';

interface EventsTabProps {
  events: any[];
  onRefresh: () => void;
}

export default function EventsTab({ events, onRefresh }: EventsTabProps) {
  const [filters, setFilters] = useState({
    invoiceId: '',
    eventType: '',
    after: ''
  });
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    
    if (filters.invoiceId) {
      filtered = filtered.filter(e => e.invoiceId?.includes(filters.invoiceId));
    }
    
    if (filters.eventType) {
      filtered = filtered.filter(e => e.type === filters.eventType);
    }
    
    if (filters.after) {
      const afterDate = new Date(filters.after);
      filtered = filtered.filter(e => new Date(e.timestamp) > afterDate);
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, filters]);

  const clearFilters = () => {
    setFilters({ invoiceId: '', eventType: '', after: '' });
  };

  const handleSync = async () => {
    setSyncing(true);
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  const eventTypes = [...new Set(events.map(e => e.type))].sort();
  const uniqueInvoiceIds = [...new Set(events.map(e => e.invoiceId).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Events</h2>
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/60">
            {filteredEvents.length} of {events.length} events
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded text-sm font-medium transition"
          >
            {loading ? 'Syncing...' : '🔄 Sync'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-white/10 rounded bg-white/5">
        <div>
          <label className="block text-sm text-white/70 mb-1">Invoice ID</label>
          <select 
            value={filters.invoiceId} 
            onChange={e => setFilters(f => ({...f, invoiceId: e.target.value}))}
            className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm"
          >
            <option value="">All Invoices</option>
            {uniqueInvoiceIds.map(id => (
              <option key={id} value={id}>
                #{id.slice(0, 8)}...
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-white/70 mb-1">Event Type</label>
          <select 
            value={filters.eventType} 
            onChange={e => setFilters(f => ({...f, eventType: e.target.value}))}
            className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm"
          >
            <option value="">All Types</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-white/70 mb-1">After Date</label>
          <input 
            type="date" 
            value={filters.after} 
            onChange={e => setFilters(f => ({...f, after: e.target.value}))}
            className="w-full p-2 bg-black/20 border border-white/20 rounded text-sm"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full p-2 border border-white/20 rounded text-sm hover:bg-white/10 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            {syncing ? (
              <div className="space-y-2">
                <div className="text-white/60">🔄 Syncing with Hedera Consensus Service...</div>
                <div className="text-sm text-white/50">This may take a moment to fetch the latest events.</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-white/60">No events found</div>
                <div className="text-sm text-white/50">
                  {filters.invoiceId || filters.eventType || filters.after 
                    ? 'Try adjusting your filters or sync for latest data.'
                    : 'Events will appear here as invoices are created and transactions occur.'
                  }
                </div>
              </div>
            )}
          </div>
        ) : (
          filteredEvents.map((event, i) => (
            <EventCard key={i} event={event} />
          ))
        )}
      </div>

      {/* Event Stats */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {eventTypes.slice(0, 4).map(type => {
            const count = events.filter(e => e.type === type).length;
            return (
              <div key={type} className="bg-white/5 border border-white/10 rounded p-3">
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-xs text-white/60">{type.replace(/_/g, ' ')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-white/10 rounded bg-white/5 hover:bg-white/10 transition">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <EventIcon type={event.type} />
            <div>
              <div className="font-medium">{event.type.replace(/_/g, ' ')}</div>
              <div className="text-sm text-white/70">
                {event.invoiceId && (
                  <span>Invoice #{event.invoiceId.slice(0, 8)} • </span>
                )}
                {new Date(event.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {event.consensusTimestamp && (
              <div className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">
                On-chain
              </div>
            )}
            <button className="text-white/60 hover:text-white">
              {expanded ? '▼' : '▶'}
            </button>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10">
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Event ID:</span>
                <div className="font-mono text-xs break-all">{event.id}</div>
              </div>
              {event.consensusTimestamp && (
                <div>
                  <span className="text-white/60">Consensus Time:</span>
                  <div className="text-xs">{event.consensusTimestamp}</div>
                </div>
              )}
            </div>
            
            {event.payload && Object.keys(event.payload).length > 0 && (
              <div>
                <span className="text-white/60 text-sm">Payload:</span>
                <pre className="mt-1 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            )}
            
            {event.topicId && (
              <div className="text-xs text-white/50">
                Topic: {event.topicId}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const icons = {
    INVOICE_CREATED: '📄',
    INVOICE_LISTED: '🏪',
    INVESTMENT_MADE: '💰',
    INVOICE_FUNDED: '✅',
    PAYMENT_RECEIVED: '💳',
    EVENTS_QUERIED: '🔍'
  };
  
  const colors = {
    INVOICE_CREATED: 'bg-blue-500/20 text-blue-300',
    INVOICE_LISTED: 'bg-purple-500/20 text-purple-300',
    INVESTMENT_MADE: 'bg-emerald-500/20 text-emerald-300',
    INVOICE_FUNDED: 'bg-green-500/20 text-green-300',
    PAYMENT_RECEIVED: 'bg-yellow-500/20 text-yellow-300',
    EVENTS_QUERIED: 'bg-gray-500/20 text-gray-300'
  };
  
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[type as keyof typeof colors] || 'bg-white/10 text-white/60'}`}>
      {icons[type as keyof typeof icons] || '📋'}
    </div>
  );
}