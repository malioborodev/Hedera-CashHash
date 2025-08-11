"use client";
import { useState } from "react";
import { TrendingUp, TrendingDown, Clock, Shield, MapPin, FileText, ExternalLink, Filter, Search, ChevronDown, Wallet, AlertCircle, Upload, DollarSign, Activity, PlusCircle, Briefcase, BarChart3, Eye, Download, CheckCircle, Users } from "lucide-react";
import { HorizontalTabs } from "../_components/HorizontalTabs";
import { HederaStatusIndicator } from "@/components/ui/hedera-status";

// Interface definitions
interface Invoice {
  id: string;
  exporter: string;
  commodity: string;
  amount: number;
  currency: string;
  tenor: number; // days
  yield: number; // percentage
  riskScore: number; // 1-10
  country: string;
  status: 'LISTED' | 'FUNDING' | 'FUNDED' | 'PAID';
  fundingProgress: number; // percentage
  daysRemaining: number;
  buyerCompany: string;
  description: string;
}

interface Investment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  yield: number;
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
  investmentDate: string;
  maturityDate: string;
  currentValue: number;
}

interface Event {
  id: string;
  type: 'INVESTMENT' | 'PAYMENT' | 'LISTING' | 'MATURITY';
  description: string;
  timestamp: string;
  amount?: number;
  currency?: string;
}

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    exporter: "Global Commodities Ltd",
    commodity: "Coffee Beans",
    amount: 250000,
    currency: "USD",
    tenor: 90,
    yield: 12.5,
    riskScore: 3,
    country: "Brazil",
    status: "LISTED",
    fundingProgress: 65,
    daysRemaining: 25,
    buyerCompany: "European Coffee Co",
    description: "Premium Arabica coffee beans, 500 tons, FOB Santos port"
  },
  {
    id: "INV-002",
    exporter: "Pacific Trade Corp",
    commodity: "Copper Ore",
    amount: 1200000,
    currency: "USD",
    tenor: 120,
    yield: 15.2,
    riskScore: 5,
    country: "Chile",
    status: "FUNDING",
    fundingProgress: 85,
    daysRemaining: 12,
    buyerCompany: "Asian Metals Inc",
    description: "High-grade copper concentrate, 2000 tons, CIF Shanghai"
  },
  {
    id: "INV-003",
    exporter: "Agri Export Solutions",
    commodity: "Soybeans",
    amount: 800000,
    currency: "USD",
    tenor: 60,
    yield: 10.8,
    riskScore: 2,
    country: "Argentina",
    status: "FUNDED",
    fundingProgress: 100,
    daysRemaining: 45,
    buyerCompany: "Global Feed Mills",
    description: "Non-GMO soybeans, 1500 tons, FOB Buenos Aires"
  }
];

const mockInvestments: Investment[] = [
  {
    id: "INV-P001",
    invoiceId: "INV-003",
    amount: 50000,
    currency: "USD",
    yield: 10.8,
    status: "ACTIVE",
    investmentDate: "2024-01-15",
    maturityDate: "2024-03-15",
    currentValue: 52700
  },
  {
    id: "INV-P002",
    invoiceId: "INV-001",
    amount: 25000,
    currency: "USD",
    yield: 12.5,
    status: "ACTIVE",
    investmentDate: "2024-01-20",
    maturityDate: "2024-04-20",
    currentValue: 26800
  }
];

const connected = true;

const mockEvents: Event[] = [
  {
    id: "1",
    type: "INVESTMENT",
    description: "Investment of $50,000 in Coffee Beans invoice",
    timestamp: "2024-01-15T10:30:00Z",
    amount: 50000,
    currency: "USD"
  },
  {
    id: "2",
    type: "LISTING",
    description: "New Copper Ore invoice listed",
    timestamp: "2024-01-14T15:45:00Z",
    amount: 1200000,
    currency: "USD"
  },
  {
    id: "3",
    type: "PAYMENT",
    description: "Payment received for Soybeans invoice",
    timestamp: "2024-01-13T09:15:00Z",
    amount: 800000,
    currency: "USD"
  }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('market');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('yield');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleInvest = (invoiceId: string, amount: number) => {
    console.log(`Investing $${amount} in invoice ${invoiceId}`);
    // Investment logic here
  };

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesStatus = filterStatus === 'ALL' || invoice.status === filterStatus;
    const matchesSearch = invoice.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.exporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case 'yield':
        return b.yield - a.yield;
      case 'amount':
        return b.amount - a.amount;
      case 'tenor':
        return a.tenor - b.tenor;
      case 'risk':
        return a.riskScore - b.riskScore;
      default:
        return 0;
    }
  });

  const renderMarketTab = () => (
    <div className="space-y-6">
      {/* Hedera Status */}
      <div className="grid grid-cols-1 gap-6">
        <HederaStatusIndicator />
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur rounded-xl p-6 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">$2.4M</h3>
          <p className="text-emerald-400 text-sm font-medium">Total Market Value</p>
          <p className="text-slate-400 text-xs mt-1">+12.5% from last month</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">47</h3>
          <p className="text-blue-400 text-sm font-medium">Active Invoices</p>
          <p className="text-slate-400 text-xs mt-1">+8 new this week</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">13.2%</h3>
          <p className="text-purple-400 text-sm font-medium">Avg. Yield</p>
          <p className="text-slate-400 text-xs mt-1">Across all commodities</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur rounded-xl p-6 border border-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">1,247</h3>
          <p className="text-orange-400 text-sm font-medium">Active Investors</p>
          <p className="text-slate-400 text-xs mt-1">+156 this month</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search commodities, exporters, countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none w-full sm:w-80"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="LISTED">Listed</option>
              <option value="FUNDING">Funding</option>
              <option value="FUNDED">Funded</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="yield">Sort by Yield</option>
              <option value="amount">Sort by Amount</option>
              <option value="tenor">Sort by Tenor</option>
              <option value="risk">Sort by Risk</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-sm">{sortedInvoices.length} invoices</span>
          </div>
        </div>
      </div>

      {/* Invoice Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{invoice.commodity}</h3>
                <p className="text-slate-400 text-sm">{invoice.exporter}</p>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-sm">{invoice.country}</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Amount:</span>
                <span className="text-white font-medium">${invoice.amount.toLocaleString()} {invoice.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Yield:</span>
                <span className="text-emerald-400 font-medium">{invoice.yield}% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Tenor:</span>
                <span className="text-white">{invoice.tenor} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Risk Score:</span>
                <div className="flex items-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < invoice.riskScore
                          ? invoice.riskScore <= 3
                            ? 'bg-emerald-400'
                            : invoice.riskScore <= 6
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                          : 'bg-slate-600'
                      }`}
                    />
                  ))}
                  <span className="text-white text-sm ml-2">{invoice.riskScore}/10</span>
                </div>
              </div>
            </div>
            
            {invoice.status === 'FUNDING' && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Funding Progress</span>
                  <span className="text-white">{invoice.fundingProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${invoice.fundingProgress}%` }}
                  />
                </div>
                <p className="text-slate-400 text-xs mt-1">{invoice.daysRemaining} days remaining</p>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  invoice.status === 'LISTED' ? 'bg-blue-400' :
                  invoice.status === 'FUNDING' ? 'bg-yellow-400' :
                  invoice.status === 'FUNDED' ? 'bg-emerald-400' : 'bg-slate-400'
                }`} />
                <span className="text-slate-400 text-sm capitalize">{invoice.status.toLowerCase()}</span>
              </div>
              
              <div className="flex space-x-2">
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedInvoice(invoice)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
                >
                  Invest
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateTab = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Invoice</h2>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Commodity Type</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="">Select commodity</option>
                  <option value="coffee">Coffee Beans</option>
                  <option value="copper">Copper Ore</option>
                  <option value="soybeans">Soybeans</option>
                  <option value="palm-oil">Palm Oil</option>
                  <option value="rubber">Natural Rubber</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                <input
                  type="number"
                  placeholder="1000"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none">
                  <option value="tons">Tons</option>
                  <option value="kg">Kilograms</option>
                  <option value="lbs">Pounds</option>
                  <option value="barrels">Barrels</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Value (USD)</label>
                <input
                  type="number"
                  placeholder="250000"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Buyer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="European Coffee Co"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
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
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Terms & Conditions</h3>
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
                <input
                  type="number"
                  step="0.1"
                  placeholder="12.5"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estimated Returns */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Estimated Returns</h3>
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
          </div>

          {/* Required Documents */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Required Documents</h3>
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
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
              Save Draft
            </button>
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
              Submit for Review
            </button>
            <button className="w-full border border-slate-600 text-slate-300 py-3 px-4 rounded-lg font-medium hover:bg-slate-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
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
              <span className="text-slate-400">15%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-white">Textiles & Materials</span>
              </div>
              <span className="text-slate-400">10%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
          <div className="h-48 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700">
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
                        <p className="text-white font-medium">{invoice?.commodity}</p>
                        <p className="text-slate-400 text-sm">{invoice?.exporter}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-white">${investment.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-emerald-400">{investment.yield}%</span>
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
                  <p className="text-slate-400 text-xs">Friday, 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-white text-sm font-medium">Risk Management Class</p>
                  <p className="text-slate-400 text-xs">Next Monday</p>
                </div>
              </div>
            </div>
          </div>

          {/* Market Alerts */}
           <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
             <h3 className="text-lg font-semibold text-white mb-4">Market Alerts</h3>
             <div className="space-y-3">
               <div className="flex items-start space-x-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                 <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                 <div>
                   <p className="text-emerald-400 text-sm font-medium">New Opportunities</p>
                   <p className="text-slate-300 text-xs">5 new coffee contracts available</p>
                 </div>
               </div>
               <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
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
         return renderCreateTab();
       case 'portfolio':
         return renderPortfolioTab();
       case 'events':
         return renderEventsTab();
       default:
         return renderMarketTab();
     }
   };

   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50">
       <HorizontalTabs activeTab={activeTab} onTabChange={handleTabChange} />
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         {renderTabContent()}
       </div>

       {/* Investment Modal */}
       {selectedInvoice && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
           <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
             <h3 className="text-xl font-semibold text-white mb-4">Invest in {selectedInvoice.commodity}</h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">Investment Amount (USD)</label>
                 <input
                   type="number"
                   value={investAmount}
                   onChange={(e) => setInvestAmount(e.target.value)}
                   placeholder="10000"
                   className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                 />
               </div>
               <div className="bg-slate-700/50 rounded-lg p-4">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Expected Return:</span>
                   <span className="text-emerald-400">{selectedInvoice.yield}% APY</span>
                 </div>
                 <div className="flex justify-between text-sm mt-1">
                   <span className="text-slate-400">Maturity:</span>
                   <span className="text-white">{selectedInvoice.tenor} days</span>
                 </div>
                 <div className="flex justify-between text-sm mt-1">
                   <span className="text-slate-400">Risk Score:</span>
                   <span className="text-white">{selectedInvoice.riskScore}/10</span>
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
                   className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
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