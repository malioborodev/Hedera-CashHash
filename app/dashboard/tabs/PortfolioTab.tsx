"use client";
import { useMemo } from 'react';

interface PortfolioTabProps {
  invoices: any[];
  events: any[];
  accountId: string;
}

export default function PortfolioTab({ invoices, events, accountId }: PortfolioTabProps) {
  const userInvoices = useMemo(() => {
    return invoices.filter((inv: any) => 
      inv.sellerId === accountId ||
      inv.ftId || // any invoice with tokenization (investable)
      inv.fundedPct > 0 ||
      inv.status === 'FUNDED' || inv.status === 'PAID'
    );
  }, [invoices, accountId]);

  const userEvents = useMemo(() => {
    return events.filter((e: any) => 
      userInvoices.find((inv: any) => inv.id === e.invoiceId) ||
      e.payload?.investorId === accountId
    ).slice(0, 10);
  }, [events, userInvoices, accountId]);

  const myInvoices = userInvoices.filter(inv => inv.sellerId === accountId);
  const myInvestments = userInvoices.filter(inv => inv.sellerId !== accountId && (inv.fundedPct > 0 || inv.ftId));

  const totalInvoiceValue = myInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalInvestments = myInvestments.reduce((sum, inv) => sum + (inv.fundedPct * inv.amount / 100), 0);
  const activeInvoices = myInvoices.filter(inv => inv.status === 'LISTED' || inv.status === 'FUNDED').length;
  const activeInvestments = myInvestments.filter(inv => inv.status === 'FUNDED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <div className="text-xs text-white/60">
          Connected: {accountId}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-2xl font-semibold text-emerald-400">{myInvoices.length}</div>
          <div className="text-xs text-white/60">My Invoices</div>
          <div className="text-xs text-white/50">{activeInvoices} active</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-2xl font-semibold text-blue-400">{myInvestments.length}</div>
          <div className="text-xs text-white/60">My Investments</div>
          <div className="text-xs text-white/50">{activeInvestments} active</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-2xl font-semibold">${totalInvoiceValue.toLocaleString()}</div>
          <div className="text-xs text-white/60">Invoice Value</div>
          <div className="text-xs text-white/50">Total created</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-2xl font-semibold">${totalInvestments.toLocaleString()}</div>
          <div className="text-xs text-white/60">Invested</div>
          <div className="text-xs text-white/50">Total amount</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Invoices */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">My Invoices</h3>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'create' }))}
              className="text-emerald-400 hover:text-emerald-300 text-sm cursor-pointer"
            >
              Create New →
            </button>
          </div>
          
          {myInvoices.length === 0 ? (
            <div className="border border-white/10 rounded p-6 text-center">
              <div className="text-white/60 mb-2">No invoices yet</div>
              <div className="text-sm text-white/50">Create your first invoice to get started</div>
            </div>
          ) : (
            <div className="space-y-3">
              {myInvoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="border border-white/10 rounded p-3 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">#{invoice.id.slice(0,8)}</div>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{invoice.amount} {invoice.currency}</span>
                    <span className="text-white/60">{invoice.fundedPct || 0}% funded</span>
                  </div>
                  {invoice.fundedPct > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all" 
                          style={{ width: `${invoice.fundedPct}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {myInvoices.length > 5 && (
                <div className="text-center">
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'market' }))}
                    className="text-emerald-400 hover:text-emerald-300 text-sm cursor-pointer"
                  >
                    View all {myInvoices.length} invoices →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Investments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">My Investments</h3>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'market' }))}
              className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
            >
              Browse Market →
            </button>
          </div>
          
          {myInvestments.length === 0 ? (
            <div className="border border-white/10 rounded p-6 text-center">
              <div className="text-white/60 mb-2">No investments yet</div>
              <div className="text-sm text-white/50">Browse the marketplace to start investing</div>
            </div>
          ) : (
            <div className="space-y-3">
              {myInvestments.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="border border-white/10 rounded p-3 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">#{invoice.id.slice(0,8)}</div>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{invoice.sellerId}</span>
                    <span className="text-white/60">
                      {invoice.yieldBps ? `${(invoice.yieldBps/100).toFixed(1)}% yield` : 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {myInvestments.length > 5 && (
                <div className="text-center">
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'market' }))}
                    className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
                  >
                    View all {myInvestments.length} investments →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h3 className="font-semibold">Recent Activity</h3>
        
        {userEvents.length === 0 ? (
          <div className="border border-white/10 rounded p-6 text-center">
            <div className="text-white/60 mb-2">No recent activity</div>
            <div className="text-sm text-white/50">Your invoice and investment activities will appear here</div>
          </div>
        ) : (
          <div className="space-y-2">
            {userEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-white/10 rounded bg-white/5">
                <EventIcon type={event.type} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{getEventDescription(event)}</div>
                  <div className="text-xs text-white/60">
                    {new Date(event.timestamp).toLocaleString()} • Invoice #{event.invoiceId?.slice(0,8)}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'events' }))}
                className="text-white/60 hover:text-white text-sm cursor-pointer"
              >
                View all activity →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    LISTED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    FUNDED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    PAID: 'bg-green-500/20 text-green-300 border-green-500/30',
    EXPIRED: 'bg-red-500/20 text-red-300 border-red-500/30'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs border ${colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
      {status}
    </span>
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
  
  return (
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
      {icons[type as keyof typeof icons] || '📋'}
    </div>
  );
}

function getEventDescription(event: any): string {
  const descriptions = {
    INVOICE_CREATED: 'Invoice created',
    INVOICE_LISTED: 'Invoice listed on marketplace',
    INVESTMENT_MADE: `Investment of ${event.payload?.amount || 'N/A'} made`,
    INVOICE_FUNDED: 'Invoice fully funded',
    PAYMENT_RECEIVED: 'Payment received',
    EVENTS_QUERIED: 'Events queried'
  };
  
  return descriptions[event.type as keyof typeof descriptions] || `${event.type} event`;
}