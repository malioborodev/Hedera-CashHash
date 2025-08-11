"use client";
import { useState, useEffect } from 'react';
import { useWallet } from '../wallet/WalletProvider';
import { Api, uploadInvoiceFile } from '../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Tab Components
import MarketplaceTab from './tabs/MarketplaceTab';
import CreateInvoiceTab from './tabs/CreateInvoiceTab';
import PortfolioTab from './tabs/PortfolioTab';
import EventsTab from './tabs/EventsTab';

type TabType = 'market' | 'create' | 'portfolio' | 'events';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { accountId } = useWallet();
  const router = useRouter();

  // Redirect if wallet not connected
  useEffect(() => {
    if (!accountId) {
      router.push('/');
      return;
    }
  }, [accountId, router]);

  // Load shared data
  useEffect(() => {
    const loadData = async () => {
      if (!accountId) return;
      
      try {
        setLoading(true);
        const [invoicesData, eventsData] = await Promise.all([
          Api.listInvoices(),
          Api.listEvents(new URLSearchParams())
        ]);
        setInvoices(invoicesData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for tab switch events
    const handleTabSwitch = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchTab', handleTabSwitch as EventListener);
    return () => window.removeEventListener('switchTab', handleTabSwitch as EventListener);
  }, [accountId]);

  // Refresh data when invoice is created or investment is made
  const refreshData = async () => {
    try {
      const [invoicesData, eventsData] = await Promise.all([
        Api.listInvoices(),
        Api.listEvents(new URLSearchParams())
      ]);
      setInvoices(invoicesData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  if (!accountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
          <p className="text-white/70 mb-4">Please connect your HashPack wallet to access the dashboard.</p>
          <Link href="/" className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 transition">
            Go to Landing Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="text-xs text-white/60">
          Connected: {accountId}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-8">
          {[
            { id: 'market', label: 'Market', icon: '🏪' },
            { id: 'create', label: 'Create', icon: '➕' },
            { id: 'portfolio', label: 'Portfolio', icon: '💼' },
            { id: 'events', label: 'Events', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white/60">Loading dashboard...</div>
          </div>
        ) : (
          <>
            {activeTab === 'market' && (
              <MarketplaceTab 
                invoices={invoices} 
                onInvestmentMade={refreshData}
              />
            )}
            {activeTab === 'create' && (
              <CreateInvoiceTab 
                onInvoiceCreated={refreshData}
              />
            )}
            {activeTab === 'portfolio' && (
              <PortfolioTab 
                invoices={invoices}
                events={events}
                accountId={accountId}
              />
            )}
            {activeTab === 'events' && (
              <EventsTab 
                events={events}
                onRefresh={refreshData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}