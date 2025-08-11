"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, Shield, MapPin, FileText, ExternalLink, Filter, Search, ChevronDown, Wallet, AlertCircle, Upload, DollarSign, Activity, PlusCircle, Briefcase, BarChart3, Eye, Download, CheckCircle, Users, Calendar, Target, Percent, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedTabs } from "@/components/ui/enhanced-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { HederaStatusIndicator } from "@/components/ui/hedera-status";
import { useAppStore } from "@/lib/state/app-store";
import { WalletConnect } from "@/components/wallet/WalletConnect";

// Interface definitions
interface Invoice {
  id: string;
  exporter: string;
  amount: number;
  currency: string;
  tenor: number; // days (≤60)
  yieldPercent: number; // percentage
  riskBadge: 'G' | 'Y' | 'R'; // Green/Yellow/Red
  country: string;
  status: 'LISTED' | 'FUNDING' | 'FUNDED' | 'PAID' | 'DEFAULTED';
  fundedPercent: number; // percentage
  fundedAmount: number;
  remainingAmount: number;
  buyerCompany: string;
  description: string;
  hbarBond: number;
  nftId?: string;
  ftId?: string;
  maturity: string;
  createdAt: string;
}

interface Investment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  estimatedReturn: number;
  yieldPercent: number;
  status: 'ACTIVE' | 'FUNDED' | 'PAID' | 'DEFAULTED';
  investmentDate: string;
  maturityDate: string;
  currentValue: number;
  proRataShare: number; // percentage of total invoice
  txHash?: string;
}

interface Event {
  id: string;
  type: 'LISTED' | 'INVESTED' | 'PAID' | 'DEFAULTED' | 'DOC_UPLOADED' | 'BOND_POSTED';
  invoiceId: string;
  description: string;
  consensusTimestamp: string;
  transactionId: string;
  actor: string;
  data: any;
  amount?: number;
  currency?: string;
}

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    exporter: "Global Trade Co.",
    amount: 50000,
    currency: "USD",
    tenor: 45,
    yieldPercent: 8.5,
    riskBadge: "G",
    country: "Singapore",
    status: "LISTED",
    fundedPercent: 0,
    fundedAmount: 0,
    remainingAmount: 50000,
    buyerCompany: "Tech Solutions Inc.",
    description: "High-quality electronic components for manufacturing",
    hbarBond: 500,
    nftId: "0.0.123456",
    ftId: "0.0.123457",
    maturity: "2024-03-15",
    createdAt: "2024-01-29"
  },
  {
    id: "INV-002",
    exporter: "Maritime Exports Ltd.",
    amount: 125000,
    currency: "USD",
    tenor: 60,
    yieldPercent: 12.0,
    riskBadge: "Y",
    country: "Malaysia",
    status: "FUNDING",
    fundedPercent: 65,
    fundedAmount: 81250,
    remainingAmount: 43750,
    buyerCompany: "Industrial Corp.",
    description: "Heavy machinery for construction projects",
    hbarBond: 1250,
    nftId: "0.0.123458",
    ftId: "0.0.123459",
    maturity: "2024-03-30",
    createdAt: "2024-01-28"
  },
  {
    id: "INV-003",
    exporter: "Agri Export Partners",
    amount: 75000,
    currency: "USD",
    tenor: 30,
    yieldPercent: 6.8,
    riskBadge: "G",
    country: "Thailand",
    status: "FUNDED",
    fundedPercent: 100,
    fundedAmount: 75000,
    remainingAmount: 0,
    buyerCompany: "Food Processing Ltd.",
    description: "Premium agricultural products for food processing",
    hbarBond: 750,
    nftId: "0.0.123460",
    ftId: "0.0.123461",
    maturity: "2024-02-28",
    createdAt: "2024-01-27"
  },
  {
    id: "INV-004",
    exporter: "Textile Traders",
    amount: 35000,
    currency: "USD",
    tenor: 25,
    yieldPercent: 9.2,
    riskBadge: "R",
    country: "Vietnam",
    status: "PAID",
    fundedPercent: 100,
    fundedAmount: 35000,
    remainingAmount: 0,
    buyerCompany: "Fashion House",
    description: "High-quality textile materials for fashion industry",
    hbarBond: 350,
    nftId: "0.0.123462",
    ftId: "0.0.123463",
    maturity: "2024-02-23",
    createdAt: "2024-01-26"
  }
];

const mockInvestments: Investment[] = [
  {
    id: "INV-P001",
    invoiceId: "INV-003",
    amount: 50000,
    currency: "USD",
    estimatedReturn: 52700,
    yieldPercent: 6.8,
    status: "PAID",
    investmentDate: "2024-01-15",
    maturityDate: "2024-02-28",
    currentValue: 52700,
    proRataShare: 66.67,
    txHash: "0.0.123456@1706097600.123456789"
  },
  {
    id: "INV-P002",
    invoiceId: "INV-002",
    amount: 25000,
    currency: "USD",
    estimatedReturn: 28000,
    yieldPercent: 12.0,
    status: "ACTIVE",
    investmentDate: "2024-01-20",
    maturityDate: "2024-03-30",
    currentValue: 26800,
    proRataShare: 20.0,
    txHash: "0.0.123458@1705737600.987654321"
  },
  {
    id: "INV-P003",
    invoiceId: "INV-004",
    amount: 15000,
    currency: "USD",
    estimatedReturn: 16380,
    yieldPercent: 9.2,
    status: "DEFAULTED",
    investmentDate: "2024-01-10",
    maturityDate: "2024-02-23",
    currentValue: 12000, // Partial recovery from bond
    proRataShare: 42.86,
    txHash: "0.0.123462@1704844800.456789123"
  }
];

const connected = true;

const mockEvents: Event[] = [
  {
    id: "1",
    type: "DOC_UPLOADED",
    invoiceId: "INV-001",
    description: "Documents uploaded to HFS",
    consensusTimestamp: "2024-01-29T08:00:00.123456789Z",
    transactionId: "0.0.123456@1706515200.123456789",
    actor: "0.0.1001",
    data: { fileIds: ["0.0.789", "0.0.790"], sha256: "abc123..." }
  },
  {
    id: "2",
    type: "BOND_POSTED",
    invoiceId: "INV-001",
    description: "Exporter bond posted",
    consensusTimestamp: "2024-01-29T08:15:00.234567890Z",
    transactionId: "0.0.123456@1706516100.234567890",
    actor: "0.0.1001",
    data: { bondAmount: 500 },
    amount: 500,
    currency: "HBAR"
  },
  {
    id: "3",
    type: "LISTED",
    invoiceId: "INV-001",
    description: "Invoice listed for investment",
    consensusTimestamp: "2024-01-29T08:30:00.345678901Z",
    transactionId: "0.0.123456@1706517000.345678901",
    actor: "0.0.1001",
    data: { nftId: "0.0.123456", ftId: "0.0.123457" },
    amount: 50000,
    currency: "USD"
  },
  {
    id: "4",
    type: "INVESTED",
    invoiceId: "INV-002",
    description: "Investment received",
    consensusTimestamp: "2024-01-28T14:20:00.456789012Z",
    transactionId: "0.0.123458@1706454000.456789012",
    actor: "0.0.1002",
    data: { investmentAmount: 25000, fundedPercent: 65 },
    amount: 25000,
    currency: "USD"
  },
  {
    id: "5",
    type: "PAID",
    invoiceId: "INV-003",
    description: "Invoice settled and paid",
    consensusTimestamp: "2024-01-27T16:45:00.567890123Z",
    transactionId: "0.0.123460@1706371500.567890123",
    actor: "0.0.1003",
    data: { paidAmount: 75000, bondRefunded: true },
    amount: 75000,
    currency: "USD"
  },
  {
    id: "6",
    type: "DEFAULTED",
    invoiceId: "INV-004",
    description: "Invoice marked as defaulted",
    consensusTimestamp: "2024-01-26T12:00:00.678901234Z",
    transactionId: "0.0.123462@1706270400.678901234",
    actor: "0.0.1004",
    data: { bondSlashed: 350, compensationPaid: 12000 },
    amount: 12000,
    currency: "USD"
  }
];

export default function DashboardPage() {
  // Global state management
  const { 
    activeTab, 
    setActiveTab, 
    isLoading, 
    setIsLoading,
    userPreferences,
    updateUserPreferences 
  } = useAppStore();
  
  // Local state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterTenor, setFilterTenor] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [sortBy, setSortBy] = useState('yield');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [eventFilter, setEventFilter] = useState({ invoiceId: 'ALL', type: 'ALL' });
  const [relayStatus, setRelayStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDataLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate wallet connection for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isWalletConnected) {
        handleWalletConnect('0.0.1234567');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isWalletConnected]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Helper functions
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'G': return 'bg-green-100 text-green-800 border-green-200';
      case 'Y': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'R': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'G': return 'Low Risk';
      case 'Y': return 'Medium Risk';
      case 'R': return 'High Risk';
      default: return 'Unknown';
    }
  };

  const filteredAndSortedInvoices = mockInvoices
    .filter(invoice => {
      if (filterCountry !== 'ALL' && invoice.country !== filterCountry) return false;
      if (filterTenor !== 'ALL') {
        if (filterTenor === '≤30' && invoice.tenor > 30) return false;
        if (filterTenor === '31-60' && (invoice.tenor <= 30 || invoice.tenor > 60)) return false;
      }
      if (filterRisk !== 'ALL' && invoice.riskBadge !== filterRisk) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'yield':
          return b.yieldPercent - a.yieldPercent;
        case 'funded':
          return b.fundedPercent - a.fundedPercent;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const handleInvest = async (invoiceId: string, amount: number) => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (amount < 10) {
      alert('Minimum investment amount is $10');
      return;
    }

    try {
      setIsLoading(true);
      // Simulate API call
      const response = await fetch(`/api/invoices/${invoiceId}/invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUnits: amount })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Investment successful! TX Hash: ${result.txHash}`);
        setShowInvestModal(false);
        setInvestAmount('');
      } else {
        const error = await response.json();
        alert(`Investment failed: ${error.message}`);
      }
    } catch (error) {
      alert('Investment failed: Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = (address: string) => {
    setIsWalletConnected(true);
    setWalletAddress(address);
    console.log('Wallet connected:', address);
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    console.log('Wallet disconnected');
  };

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesStatus = filterStatus === 'ALL' || invoice.status === filterStatus;
    const matchesSearch = invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.exporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case 'yield':
        return b.yieldPercent - a.yieldPercent;
      case 'amount':
        return b.amount - a.amount;
      case 'tenor':
        return a.tenor - b.tenor;
      case 'risk':
        return a.riskBadge.localeCompare(b.riskBadge);
      default:
        return 0;
    }
  });

  const renderMarketTab = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Hedera Status */}
      <Card>
        <CardContent className="p-6">
          <HederaStatusIndicator />
        </CardContent>
      </Card>

      {/* Market Overview */}
      {isDataLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Market Value - Success/Growth Theme */}
        <div className="bg-gradient-success/20 backdrop-blur-sm rounded-2xl p-6 border border-success-500/30 hover:border-success-400/50 transition-all duration-300 group hover:shadow-medium">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-success rounded-xl flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform duration-200">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center space-x-1 bg-success-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 text-success-400" />
              <span className="text-success-300 text-sm font-semibold">+12.5%</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-success-100 to-white bg-clip-text text-transparent mb-2">$2.4M</h3>
          <p className="text-success-200 text-sm font-semibold mb-1">Total Market Value</p>
          <p className="text-success-300/70 text-xs flex items-center gap-1">
            <span className="w-1 h-1 bg-success-400 rounded-full"></span>
            Growth from last month
          </p>
        </div>

        {/* Active Invoices - Information Theme */}
        <div className="bg-gradient-primary/20 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300 group hover:shadow-medium">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform duration-200">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center space-x-1 bg-primary-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 text-primary-400" />
              <span className="text-primary-300 text-sm font-semibold">+8</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-primary-100 to-white bg-clip-text text-transparent mb-2">47</h3>
          <p className="text-primary-200 text-sm font-semibold mb-1">Active Invoices</p>
          <p className="text-primary-300/70 text-xs flex items-center gap-1">
            <span className="w-1 h-1 bg-primary-400 rounded-full"></span>
            New this week
          </p>
        </div>

        {/* Average Yield - Premium Analytics Theme */}
        <div className="bg-info-500/20 backdrop-blur-sm rounded-2xl p-6 border border-info-500/30 hover:border-info-400/50 transition-all duration-300 group hover:shadow-medium">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-info-500 to-info-600 rounded-xl flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center space-x-1 bg-info-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 text-info-400" />
              <span className="text-info-300 text-sm font-semibold">+2.1%</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-info-100 to-white bg-clip-text text-transparent mb-2">13.2%</h3>
          <p className="text-info-200 text-sm font-semibold mb-1">Avg. Yield</p>
          <p className="text-info-300/70 text-xs flex items-center gap-1">
            <span className="w-1 h-1 bg-info-400 rounded-full"></span>
            Across commodities
          </p>
        </div>

        {/* Active Investors - Community/Growth Theme */}
        <div className="bg-gradient-warning/20 backdrop-blur-sm rounded-2xl p-6 border border-warning-500/30 hover:border-warning-400/50 transition-all duration-300 group hover:shadow-medium">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-warning rounded-xl flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform duration-200">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center space-x-1 bg-warning-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 text-warning-400" />
              <span className="text-warning-300 text-sm font-semibold">+156</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-warning-100 to-white bg-clip-text text-transparent mb-2">1,247</h3>
          <p className="text-warning-200 text-sm font-semibold mb-1">Active Investors</p>
          <p className="text-warning-300/70 text-xs flex items-center gap-1">
            <span className="w-1 h-1 bg-warning-400 rounded-full"></span>
            New this month
          </p>
        </div>
      </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search exporters, countries, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
              </div>
            
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Countries</option>
                <option value="Singapore">Singapore</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Thailand">Thailand</option>
                <option value="Vietnam">Vietnam</option>
              </select>
              
              <select
                value={filterTenor}
                onChange={(e) => setFilterTenor(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Tenors</option>
                <option value="SHORT">Short (≤30 days)</option>
                <option value="MEDIUM">Medium (31-45 days)</option>
                <option value="LONG">Long (46-60 days)</option>
              </select>
              
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="G">Low Risk (Green)</option>
                <option value="Y">Medium Risk (Yellow)</option>
                <option value="R">High Risk (Red)</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="yield">Sort by Yield</option>
                <option value="amount">Sort by Amount</option>
                <option value="tenor">Sort by Tenor</option>
                <option value="risk">Sort by Risk</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Badge variant="secondary">{sortedInvoices.length} invoices</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {sortedInvoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:border-primary-400/50 transition-all duration-300 group bg-card-gradient backdrop-blur-sm border-border">
                 <CardContent className="p-6">
                   <div className="flex items-start justify-between mb-4">
                     <div>
                       <CardTitle className="text-lg mb-1 text-slate-900 group-hover:text-primary-700 transition-colors">{invoice.description}</CardTitle>
                       <CardDescription className="text-muted-foreground">{invoice.exporter}</CardDescription>
                     </div>
                     <div className="flex items-center space-x-2">
                       <MapPin className="w-4 h-4 text-slate-600" />
                       <Badge variant="outline" className="border-border text-muted-foreground bg-muted/50">{invoice.country}</Badge>
                       <Badge 
                         className={`font-semibold ${
                           invoice.riskBadge === 'G' ? 'bg-green-100 text-green-700 border-green-300' :
                           invoice.riskBadge === 'Y' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                           'bg-red-100 text-red-700 border-red-300'
                         }`}
                       >
                         {getRiskLabel(invoice.riskBadge)}
                       </Badge>
                     </div>
                   </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">Amount:</span>
                <span className="text-slate-900 font-medium">${invoice.amount.toLocaleString()} {invoice.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">Yield:</span>
                <span className="text-emerald-700 font-semibold bg-emerald-100 px-2 py-1 rounded-md">{invoice.yieldPercent}% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">Tenor:</span>
                <span className="text-blue-700 font-medium">{invoice.tenor} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">Risk Score:</span>
                <div className="flex items-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < invoice.riskScore
                          ? invoice.riskScore <= 3
                            ? 'bg-success-400 shadow-success-400/50 shadow-sm'
                            : invoice.riskScore <= 6
                            ? 'bg-warning-400 shadow-warning-400/50 shadow-sm'
                            : 'bg-destructive-400 shadow-destructive-400/50 shadow-sm'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                  <span className={`text-sm ml-2 font-medium ${
                    invoice.riskScore <= 3 ? 'text-success-300' :
                    invoice.riskScore <= 6 ? 'text-warning-300' : 'text-destructive-300'
                  }`}>{invoice.riskScore}/10</span>
                </div>
              </div>
            </div>
            
            {invoice.status === 'FUNDING' && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Funding Progress</span>
                  <span className="text-primary-200 font-semibold">{invoice.fundingProgress}%</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-3 border border-border">
                  <div
                    className="bg-gradient-primary h-full rounded-full transition-all duration-500 shadow-primary-500/30 shadow-sm"
                    style={{ width: `${invoice.fundingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    <span className="w-1 h-1 bg-warning-400 rounded-full"></span>
                    {invoice.daysRemaining} days remaining
                  </p>
                  <span className="text-xs text-primary-300 bg-primary-500/10 px-2 py-1 rounded-full">
                    ${((invoice.amount * invoice.fundingProgress) / 100).toLocaleString()} funded
                  </span>
                </div>
              </div>
            )}
            
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <Badge 
                        className={`font-semibold ${
                          invoice.status === 'LISTED' ? 'bg-primary-500/15 text-primary-300 border-primary-500/30' :
                          invoice.status === 'FUNDING' ? 'bg-warning-500/15 text-warning-300 border-warning-500/30' :
                          invoice.status === 'FUNDED' ? 'bg-success-500/15 text-success-300 border-success-500/30' :
                          'bg-info-500/15 text-info-300 border-info-500/30'
                        }`}
                      >
                        {invoice.status.toLowerCase()}
                      </Badge>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-muted/50 hover:text-primary-300 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="bg-gradient-primary hover:bg-gradient-primary-hover text-white font-semibold shadow-primary-500/25 shadow-lg hover:shadow-primary-500/40 transition-all duration-200"
                          size="sm"
                        >
                          Invest
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    );

  const renderCreateInvoiceTab = () => (
    <motion.div 
      className="max-w-4xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <CardTitle className="text-2xl mb-6">Create New Invoice</CardTitle>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">1</span>
            </div>
            <span className="text-emerald-400 font-medium">Invoice Details</span>
          </div>
          <div className="flex-1 h-px bg-slate-700 mx-4"></div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-slate-400 text-sm font-medium">2</span>
            </div>
            <span className="text-slate-400 font-medium">Documentation</span>
          </div>
          <div className="flex-1 h-px bg-slate-700 mx-4"></div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-slate-400 text-sm font-medium">3</span>
            </div>
            <span className="text-slate-400 font-medium">Review & Submit</span>
          </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Basic Information</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Commodity Type</label>
                <select className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-white focus:border-success-500 focus:outline-none">
                  <option value="">Select commodity</option>
                  <option value="coffee">Coffee Beans</option>
                  <option value="copper">Copper Ore</option>
                  <option value="soybeans">Soybeans</option>
                  <option value="palm-oil">Palm Oil</option>
                  <option value="rubber">Natural Rubber</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Quantity</label>
                <input
                  type="number"
                  placeholder="1000"
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-white placeholder-muted-foreground focus:border-success-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Unit</label>
                <select className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-white focus:border-success-500 focus:outline-none">
                  <option value="tons">Tons</option>
                  <option value="kg">Kilograms</option>
                  <option value="lbs">Pounds</option>
                  <option value="barrels">Barrels</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Total Value (USD)</label>
                  <Input
                    type="number"
                    placeholder="250000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Buyer Information</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                  <Input
                    type="text"
                    placeholder="European Coffee Co"
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="DE">Germany</option>
                  <option value="JP">Japan</option>
                  <option value="CN">China</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Credit Rating</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="">Select credit rating</option>
                  <option value="AAA">AAA - Excellent</option>
                  <option value="AA">AA - Very Good</option>
                  <option value="A">A - Good</option>
                  <option value="BBB">BBB - Adequate</option>
                  <option value="BB">BB - Speculative</option>
                </select>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Terms & Conditions</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Terms (Days)</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                  <option value="120">120 Days</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expected Yield (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="12.5"
                  />
                </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Terms</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="FOB">FOB (Free on Board)</option>
                  <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                  <option value="DDP">DDP (Delivered Duty Paid)</option>
                </select>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estimated Returns */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Estimated Returns</CardTitle>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Invoice Value:</span>
                <span className="text-white font-medium">$250,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Expected Yield:</span>
                <span className="text-emerald-400 font-medium">12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Platform Fee:</span>
                <span className="text-white">2.0%</span>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Net Return:</span>
                  <span className="text-emerald-400 font-bold">$26,250</span>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Required Documents</CardTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">Commercial Invoice</span>
                </div>
                <Upload className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">Bill of Lading</span>
                </div>
                <Upload className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">Certificate of Origin</span>
                </div>
                <Upload className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">Quality Certificate</span>
                </div>
                <Upload className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-400" />
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button variant="gradient" size="lg" className="w-full">
              Save Draft
            </Button>
            <Button variant="default" size="lg" className="w-full">
              Submit for Review
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderPortfolioTab = () => (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur rounded-xl p-6 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">$127,500</h3>
          <p className="text-emerald-400 text-sm font-medium">Total Portfolio Value</p>
          <p className="text-slate-400 text-xs mt-1">+8.2% this month</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">$8,750</h3>
          <p className="text-blue-400 text-sm font-medium">Total Returns</p>
          <p className="text-slate-400 text-xs mt-1">11.5% average yield</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-purple-400 text-sm">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">12</h3>
          <p className="text-purple-400 text-sm font-medium">Active Investments</p>
          <p className="text-slate-400 text-xs mt-1">Across 8 commodities</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur rounded-xl p-6 border border-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-orange-400 text-sm">Avg</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">67</h3>
          <p className="text-orange-400 text-sm font-medium">Days to Maturity</p>
          <p className="text-slate-400 text-xs mt-1">Weighted average</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-6">Asset Allocation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                <span className="text-white">Coffee & Agricultural</span>
              </div>
              <span className="text-slate-400">45%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-white">Metals & Mining</span>
              </div>
              <span className="text-slate-400">30%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-white">Energy & Oil</span>
              </div>
              <span className="text-muted-foreground">15%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-info-500 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-warning-500 rounded"></div>
                <span className="text-white">Textiles & Materials</span>
              </div>
              <span className="text-muted-foreground">10%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-warning-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
          <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center border border-border">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Performance Chart</p>
              <p className="text-slate-500 text-xs">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Investments Table */}
      <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Active Investments</h3>
          <div className="flex items-center space-x-4">
            <select className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <button className="text-slate-400 hover:text-white transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-sm font-medium py-3">Investment</th>
                <th className="text-left text-slate-400 text-sm font-medium py-3">Amount</th>
                <th className="text-left text-slate-400 text-sm font-medium py-3">Yield</th>
                <th className="text-left text-slate-400 text-sm font-medium py-3">Status</th>
                <th className="text-left text-slate-400 text-sm font-medium py-3">Maturity</th>
                <th className="text-left text-slate-400 text-sm font-medium py-3">Current Value</th>
                <th className="text-left text-slate-400 text-sm font-medium py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockInvestments.map((investment) => {
                const invoice = mockInvoices.find(inv => inv.id === investment.invoiceId);
                return (
                  <tr key={investment.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-4">
                      <div>
                        <p className="text-white font-medium">{invoice?.description}</p>
                        <p className="text-slate-400 text-sm">{invoice?.exporter}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-white">${investment.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-emerald-400">{investment.yieldPercent}%</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          investment.status === 'ACTIVE' ? 'bg-emerald-400' :
                          investment.status === 'COMPLETED' ? 'bg-blue-400' : 'bg-red-400'
                        }`} />
                        <span className="text-white text-sm">{investment.status}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-300">{investment.maturityDate}</span>
                    </td>
                    <td className="py-4">
                      <div>
                        <span className="text-white font-medium">${investment.currentValue.toLocaleString()}</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-xs">+{((investment.currentValue - investment.amount) / investment.amount * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-slate-400 hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-white transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCreateTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">1</span>
            </div>
            <span className="text-emerald-400 font-medium">Invoice Details</span>
          </div>
          <div className="flex-1 h-px bg-slate-700 mx-4"></div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-slate-400 text-sm font-medium">2</span>
            </div>
            <span className="text-slate-400 font-medium">Documentation</span>
          </div>
          <div className="flex-1 h-px bg-slate-700 mx-4"></div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-slate-400 text-sm font-medium">3</span>
            </div>
            <span className="text-slate-400 font-medium">Review & Submit</span>
          </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Basic Information</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Commodity Type</label>
                <select className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-white focus:border-success-500 focus:outline-none">
                  <option value="">Select commodity</option>
                  <option value="coffee">Coffee Beans</option>
                  <option value="copper">Copper Ore</option>
                  <option value="soybeans">Soybeans</option>
                  <option value="palm-oil">Palm Oil</option>
                  <option value="rubber">Natural Rubber</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Quantity</label>
                <input
                  type="number"
                  placeholder="1000"
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-white placeholder-muted-foreground focus:border-success-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Unit</label>
                <select className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-white focus:border-success-500 focus:outline-none">
                  <option value="tons">Tons</option>
                  <option value="kg">Kilograms</option>
                  <option value="lbs">Pounds</option>
                  <option value="barrels">Barrels</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Total Value (USD)</label>
                  <Input
                    type="number"
                    placeholder="250000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Buyer Information</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                  <Input
                    type="text"
                    placeholder="European Coffee Co"
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="DE">Germany</option>
                  <option value="JP">Japan</option>
                  <option value="CN">China</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Credit Rating</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="">Select credit rating</option>
                  <option value="AAA">AAA - Excellent</option>
                  <option value="AA">AA - Very Good</option>
                  <option value="A">A - Good</option>
                  <option value="BBB">BBB - Adequate</option>
                  <option value="BB">BB - Speculative</option>
                </select>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Terms & Conditions</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Terms (Days)</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                  <option value="120">120 Days</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expected Yield (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="12.5"
                  />
                </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Terms</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="FOB">FOB (Free on Board)</option>
                  <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                  <option value="DDP">DDP (Delivered Duty Paid)</option>
                </select>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estimated Returns */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Estimated Returns</CardTitle>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Invoice Value:</span>
                <span className="text-white font-medium">$250,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Expected Yield:</span>
                <span className="text-emerald-400 font-medium">12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Platform Fee:</span>
                <span className="text-white">2.0%</span>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Net Return:</span>
                  <span className="text-emerald-400 font-bold">$26,250</span>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Required Documents</CardTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">Commercial Invoice</span>
                </div>
                <Upload className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">Bill of Lading</span>
                </div>
                <Upload className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">Certificate of Origin</span>
                </div>
                <Upload className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">Quality Certificate</span>
                </div>
                <Upload className="w-4 h-4 text-slate-400 cursor-pointer hover:text-emerald-400" />
              </div>
            </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button variant="gradient" size="lg" className="w-full">
              Save Draft
            </Button>
            <Button variant="default" size="lg" className="w-full">
              Submit for Review
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderBridgeTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Bridge Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur rounded-xl p-6 border border-blue-500/20">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Cross-Chain Bridge</h2>
            <p className="text-blue-300">Transfer assets between Hedera and other blockchains</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-emerald-400 text-sm font-medium">Total Volume</div>
            <div className="text-white text-xl font-bold">$2.4M</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-blue-400 text-sm font-medium">Active Bridges</div>
            <div className="text-white text-xl font-bold">5</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-purple-400 text-sm font-medium">Avg. Time</div>
            <div className="text-white text-xl font-bold">3.2s</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bridge Transfer Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-6">Transfer Assets</CardTitle>
              
              {/* From/To Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">From Network</label>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">H</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">Hedera</div>
                        <div className="text-slate-400 text-sm">Mainnet</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">To Network</label>
                  <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                    <option value="">Select destination</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">Binance Smart Chain</option>
                    <option value="avalanche">Avalanche</option>
                  </select>
                </div>
              </div>

              {/* Asset Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">Select Asset</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">H</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">HBAR</div>
                        <div className="text-slate-400 text-sm">Balance: 1,250</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">U</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">USDC</div>
                        <div className="text-slate-400 text-sm">Balance: 5,000</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">W</span>
                      </div>
                      <div>
                        <div className="text-white font-medium">WHBAR</div>
                        <div className="text-slate-400 text-sm">Balance: 850</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pr-16"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm font-medium hover:text-blue-300">
                    MAX
                  </button>
                </div>
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                  <span>≈ $0.00 USD</span>
                  <span>Fee: ~0.1 HBAR</span>
                </div>
              </div>

              {/* Recipient Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">Recipient Address</label>
                <Input
                  type="text"
                  placeholder="0x... or ENS name"
                />
              </div>

              {/* Transfer Button */}
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Globe className="w-4 h-4 mr-2" />
                Initiate Bridge Transfer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bridge Status & Info */}
        <div className="space-y-6">
          {/* Bridge Status */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Bridge Status</CardTitle>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Hedera → Ethereum</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Hedera → Polygon</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Hedera → BSC</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-yellow-400 text-sm">Maintenance</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transfers */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Recent Transfers</CardTitle>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">100 HBAR → ETH</div>
                    <div className="text-slate-400 text-xs">2 hours ago</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">500 USDC → Polygon</div>
                    <div className="text-slate-400 text-xs">Processing...</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">250 WHBAR → BSC</div>
                    <div className="text-slate-400 text-xs">1 day ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bridge Info */}
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">Bridge Information</CardTitle>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Min Transfer:</span>
                  <span className="text-white">1 HBAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Transfer:</span>
                  <span className="text-white">10,000 HBAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bridge Fee:</span>
                  <span className="text-white">0.1 HBAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg. Time:</span>
                  <span className="text-white">2-5 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );

  const renderEventsTab = () => (
    <div className="space-y-6">
      {/* Event Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur rounded-xl p-4 border border-emerald-500/20 text-center cursor-pointer hover:border-emerald-500/50 transition-colors">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl">📈</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Market Updates</h3>
          <p className="text-slate-300 text-sm">Latest commodity prices</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur rounded-xl p-4 border border-blue-500/20 text-center cursor-pointer hover:border-blue-500/50 transition-colors">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl">🎯</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Investment Opportunities</h3>
          <p className="text-slate-300 text-sm">New listings & deals</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur rounded-xl p-4 border border-purple-500/20 text-center cursor-pointer hover:border-purple-500/50 transition-colors">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl">🎓</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Educational</h3>
          <p className="text-slate-300 text-sm">Webinars & tutorials</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur rounded-xl p-4 border border-orange-500/20 text-center cursor-pointer hover:border-orange-500/50 transition-colors">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl">🌍</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Global Events</h3>
          <p className="text-slate-300 text-sm">Trade shows & conferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Events Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Event */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur rounded-xl p-6 border border-emerald-500/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">⭐</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Featured Event</h3>
                  <p className="text-emerald-400 text-sm">Don't miss out</p>
                </div>
              </div>
              <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Global Commodity Trading Summit 2024</h4>
            <p className="text-slate-300 mb-4">Join industry leaders discussing the future of commodity trading, blockchain integration, and sustainable practices. Network with top exporters and investors.</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span>📅 March 15-17, 2024</span>
                <span>📍 Singapore</span>
                <span>👥 500+ Attendees</span>
              </div>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Register Now
              </button>
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Upcoming Events</h3>
              <div className="flex items-center space-x-2">
                <select className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none">
                  <option value="all">All Categories</option>
                  <option value="market">Market Updates</option>
                  <option value="investment">Investment</option>
                  <option value="education">Educational</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white">💰</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-medium mb-1">Coffee Market Analysis Webinar</h4>
                      <p className="text-slate-400 text-sm mb-2">Deep dive into Q1 coffee market trends and price predictions for the upcoming harvest season.</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>📅 Tomorrow, 2:00 PM EST</span>
                        <span>⏱️ 1 hour</span>
                        <span>👥 Free</span>
                      </div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                      Join →
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white">🎓</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-medium mb-1">Risk Management Masterclass</h4>
                      <p className="text-slate-400 text-sm mb-2">Learn advanced risk assessment techniques for commodity investments with industry experts.</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>📅 March 20, 10:00 AM EST</span>
                        <span>⏱️ 2 hours</span>
                        <span>👥 $49</span>
                      </div>
                    </div>
                    <button className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
                      Register →
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white">🌍</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-medium mb-1">Asia-Pacific Trade Conference</h4>
                      <p className="text-slate-400 text-sm mb-2">Annual conference focusing on trade relationships and opportunities in the Asia-Pacific region.</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>📅 April 5-7, 2024</span>
                        <span>📍 Tokyo, Japan</span>
                        <span>👥 $299</span>
                      </div>
                    </div>
                    <button className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real Events Feed */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Transaction Events</h3>
              <div className="flex items-center space-x-2">
                <select 
                  value={eventFilter} 
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Events</option>
                  <option value="LISTED">Listed</option>
                  <option value="INVESTED">Invested</option>
                  <option value="PAID">Paid</option>
                  <option value="DEFAULTED">Defaulted</option>
                  <option value="DOC_UPLOADED">Documents</option>
                  <option value="BOND_POSTED">Bonds</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              {mockEvents
                .filter(event => eventFilter === 'all' || event.type === eventFilter)
                .map((event) => {
                  const getEventIcon = (type: string) => {
                    switch (type) {
                      case 'LISTED': return '📋';
                      case 'INVESTED': return '💰';
                      case 'PAID': return '✅';
                      case 'DEFAULTED': return '❌';
                      case 'DOC_UPLOADED': return '📄';
                      case 'BOND_POSTED': return '🔒';
                      default: return '📊';
                    }
                  };

                  const getEventColor = (type: string) => {
                    switch (type) {
                      case 'LISTED': return 'bg-blue-500';
                      case 'INVESTED': return 'bg-emerald-500';
                      case 'PAID': return 'bg-green-500';
                      case 'DEFAULTED': return 'bg-red-500';
                      case 'DOC_UPLOADED': return 'bg-purple-500';
                      case 'BOND_POSTED': return 'bg-orange-500';
                      default: return 'bg-slate-500';
                    }
                  };

                  return (
                    <div key={event.id} className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className={`w-12 h-12 ${getEventColor(event.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-lg">{getEventIcon(event.type)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium mb-1">{event.description}</h4>
                            <p className="text-slate-400 text-sm mb-2">Invoice: {event.invoiceId} • Actor: {event.actor}</p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <span>🕒 {new Date(event.consensusTimestamp).toLocaleString()}</span>
                              <span>🔗 {event.transactionId}</span>
                              {event.amount && (
                                <span>💵 ${event.amount.toLocaleString()} {event.currency}</span>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              event.type === 'PAID' ? 'border-green-500 text-green-400' :
                              event.type === 'DEFAULTED' ? 'border-red-500 text-red-400' :
                              event.type === 'INVESTED' ? 'border-emerald-500 text-emerald-400' :
                              'border-slate-500 text-slate-400'
                            }`}
                          >
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Live Market Data */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Live Market Data</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Coffee (Arabica)</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white">$1.85/lb</span>
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-xs">+2.3%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Copper</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white">$8,450/ton</span>
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 text-xs">-1.2%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Soybeans</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white">$14.20/bu</span>
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-xs">+0.8%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm font-medium">Coffee Webinar</p>
                  <p className="text-slate-400 text-xs">Tomorrow, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm font-medium">Market Report Release</p>
                  <p className="text-muted-foreground text-xs">Friday, 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-info-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm font-medium">Risk Management Class</p>
                  <p className="text-muted-foreground text-xs">Next Monday</p>
                </div>
              </div>
            </div>
          </div>

          {/* Market Alerts */}
           <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
             <h3 className="text-lg font-semibold text-white mb-4">Market Alerts</h3>
             <div className="space-y-3">
               <div className="flex items-start space-x-3 p-3 bg-success-500/10 rounded-lg border border-success-500/20">
                   <CheckCircle className="w-4 h-4 text-success-400 mt-0.5" />
                   <div>
                     <p className="text-success-400 text-sm font-medium">New Opportunities</p>
                     <p className="text-muted-foreground text-xs">5 new coffee contracts available</p>
                   </div>
                 </div>
                 <div className="flex items-start space-x-3 p-3 bg-warning-500/10 rounded-lg border border-warning-500/20">
                 <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                 <div>
                   <p className="text-yellow-400 text-sm font-medium">Price Alert</p>
                   <p className="text-slate-300 text-xs">Copper prices up 3.2% today</p>
                 </div>
               </div>
               <div className="flex items-start space-x-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                 <Clock className="w-4 h-4 text-blue-400 mt-0.5" />
                 <div>
                   <p className="text-blue-400 text-sm font-medium">Maturity Alert</p>
                   <p className="text-slate-300 text-xs">2 investments mature this week</p>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );

   const renderTabContent = () => {
    switch (activeTab) {
      case 'market':
        return renderMarketTab();
      case 'create':
          return renderCreateInvoiceTab();
      case 'portfolio':
        return renderPortfolioTab();
      case 'events':
        return renderEventsTab();
      case 'bridge':
        return renderBridgeTab();
      default:
        return renderMarketTab();
    }
  };

   const tabs = [
     {
       id: 'market',
       label: 'Market',
       icon: <BarChart3 className="w-4 h-4" />,
       description: 'Browse investment opportunities'
     },
     {
       id: 'create',
       label: 'Create',
       icon: <PlusCircle className="w-4 h-4" />,
       description: 'List new invoices'
     },
     {
       id: 'portfolio',
       label: 'Portfolio',
       icon: <Briefcase className="w-4 h-4" />,
       description: 'Track your investments'
     },
     {
       id: 'events',
       label: 'Events',
       icon: <Activity className="w-4 h-4" />,
       description: 'Latest updates and news'
     },
     {
       id: 'bridge',
       label: 'Bridge',
       icon: <Shield className="w-4 h-4" />,
       description: 'Cross-chain transfers'
     }
   ];

   // Wallet gate - show connection prompt if not connected
   if (!isWalletConnected) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-white/30 to-slate-100/50 flex items-center justify-center">
         <div className="max-w-md w-full mx-4">
           <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-xl text-center">
             <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Wallet className="w-8 h-8 text-emerald-600" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Connect Your Wallet</h2>
             <p className="text-slate-600 mb-6">Connect your Hedera wallet to access the CashHash platform</p>
             <div className="space-y-4">
               <div className="text-sm text-slate-500">
                 <div>Network: <span className="font-medium text-green-600">Hedera Testnet</span></div>
                 <div>HCS Topic: <span className="font-mono text-xs">0.0.4567890</span></div>
               </div>
               <WalletConnect onConnect={handleWalletConnect} />
             </div>
           </div>
         </div>
       </div>
     );
   }

   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-white/30 to-slate-100/50">
       {/* Header with wallet info */}
       <div className="bg-white border-b border-slate-200">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
           <div className="flex justify-between items-center">
             <div>
               <h1 className="text-2xl font-bold text-slate-800">CashHash</h1>
               <p className="text-sm text-slate-600">Trade finance platform powered by Hedera</p>
             </div>
             <div className="flex items-center gap-6">
               <div className="text-sm text-slate-500">
                 <div>Network: <span className="font-medium text-green-600">Hedera Testnet</span></div>
                 <div>HCS Topic: <span className="font-mono text-xs">0.0.4567890</span></div>
               </div>
               <div className="flex items-center gap-3">
                 <div className="text-sm text-right">
                   <div className="text-slate-600">Connected:</div>
                   <div className="font-mono text-xs text-slate-800">{walletAddress}</div>
                 </div>
                 <Button 
                   onClick={handleWalletDisconnect}
                   variant="outline"
                   size="sm"
                 >
                   Disconnect
                 </Button>
               </div>
             </div>
           </div>
         </div>
       </div>
       
       <EnhancedTabs 
         tabs={tabs}
         activeTab={activeTab}
         onTabChange={handleTabChange}
         variant="default"
         size="lg"
       />
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         <AnimatePresence mode="wait">
           <motion.div
             key={activeTab}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             transition={{ duration: 0.3 }}
           >
             {renderTabContent()}
           </motion.div>
         </AnimatePresence>
       </div>

       {/* Investment Modal */}
       {selectedInvoice && (
         <div className="fixed inset-0 bg-black/20 backdrop-blur flex items-center justify-center z-50">
           <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border border-slate-200 shadow-xl">
             <h3 className="text-xl font-semibold text-slate-900 mb-4">Invest in {selectedInvoice.commodity}</h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Investment Amount (USD)</label>
                 <input
                   type="number"
                   value={investAmount}
                   onChange={(e) => setInvestAmount(e.target.value)}
                   placeholder="10000"
                   className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                 />
               </div>
               <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-600">Expected Return:</span>
                   <span className="text-emerald-600 font-semibold">{selectedInvoice.yield}% APY</span>
                 </div>
                 <div className="flex justify-between text-sm mt-1">
                   <span className="text-slate-600">Maturity:</span>
                   <span className="text-slate-900">{selectedInvoice.tenor} days</span>
                 </div>
                 <div className="flex justify-between text-sm mt-1">
                   <span className="text-slate-600">Risk Score:</span>
                   <span className="text-slate-900">{selectedInvoice.riskScore}/10</span>
                 </div>
               </div>
               <div className="flex gap-3">
                 <button
                   onClick={() => {
                     if (investAmount) {
                       handleInvest(selectedInvoice.id, parseFloat(investAmount));
                       setSelectedInvoice(null);
                       setInvestAmount('');
                     }
                   }}
                   className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                 >
                   Confirm Investment
                 </button>
                 <button
                   onClick={() => {
                     setSelectedInvoice(null);
                     setInvestAmount('');
                   }}
                   className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }