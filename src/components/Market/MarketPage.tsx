'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Clock, DollarSign, Shield, ChevronDown, Star } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  description: string;
  riskScore: number;
  totalInvestment: number;
  fundingGoal: number;
  investmentCount: number;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    creditScore?: number;
  };
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  expectedReturn: number;
  tenor: number;
  industry?: string;
  status: string;
}

interface MarketFilters {
  search: string;
  minAmount: string;
  maxAmount: string;
  currency: string;
  riskLevel: string;
  industry: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const MarketPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketFilters>({
    search: '',
    minAmount: '',
    maxAmount: '',
    currency: '',
    riskLevel: '',
    industry: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // Mock data for development
  const mockInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      amount: 50000,
      currency: 'USD',
      dueDate: '2024-06-15',
      description: 'Software development services for Q2 2024',
      riskScore: 25,
      totalInvestment: 15000,
      fundingGoal: 50000,
      investmentCount: 8,
      seller: {
        id: 'seller1',
        firstName: 'John',
        lastName: 'Smith',
        companyName: 'TechCorp Solutions',
        creditScore: 750
      },
      buyer: {
        id: 'buyer1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        companyName: 'Global Enterprises'
      },
      expectedReturn: 8.5,
      tenor: 90,
      industry: 'Technology',
      status: 'listed'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      amount: 25000,
      currency: 'USD',
      dueDate: '2024-05-30',
      description: 'Manufacturing equipment supply',
      riskScore: 45,
      totalInvestment: 8000,
      fundingGoal: 25000,
      investmentCount: 5,
      seller: {
        id: 'seller2',
        firstName: 'Mike',
        lastName: 'Wilson',
        companyName: 'Industrial Supply Co',
        creditScore: 680
      },
      buyer: {
        id: 'buyer2',
        firstName: 'David',
        lastName: 'Brown',
        companyName: 'Manufacturing Inc'
      },
      expectedReturn: 12.0,
      tenor: 60,
      industry: 'Manufacturing',
      status: 'listed'
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-003',
      amount: 75000,
      currency: 'USD',
      dueDate: '2024-07-20',
      description: 'Consulting services for digital transformation',
      riskScore: 15,
      totalInvestment: 30000,
      fundingGoal: 75000,
      investmentCount: 12,
      seller: {
        id: 'seller3',
        firstName: 'Emily',
        lastName: 'Davis',
        companyName: 'Strategic Consulting Group',
        creditScore: 820
      },
      buyer: {
        id: 'buyer3',
        firstName: 'Robert',
        lastName: 'Miller',
        companyName: 'Fortune 500 Corp'
      },
      expectedReturn: 6.5,
      tenor: 120,
      industry: 'Consulting',
      status: 'listed'
    }
  ];

  useEffect(() => {
    fetchInvoices();
  }, [filters, currentPage]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/invoices/market', { ... });
      // const data = await response.json();
      
      // For now, use mock data
      setTimeout(() => {
        setInvoices(mockInvoices);
        setTotalPages(Math.ceil(mockInvoices.length / itemsPerPage));
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch invoices');
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof MarketFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      minAmount: '',
      maxAmount: '',
      currency: '',
      riskLevel: '',
      industry: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const getFundingProgress = (totalInvestment: number, fundingGoal: number) => {
    return Math.min((totalInvestment / fundingGoal) * 100, 100);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="h-20 bg-gray-300 rounded mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={fetchInvoices}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice Market</h1>
              <p className="text-gray-600 mt-1">Discover and invest in verified invoices</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {invoices.length} invoices available
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="riskScore-asc">Lowest Risk</option>
                <option value="riskScore-desc">Highest Risk</option>
                <option value="expectedReturn-desc">Highest Return</option>
              </select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={filters.currency}
                    onChange={(e) => handleFilterChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Currencies</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="HBAR">HBAR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                  <select
                    value={filters.riskLevel}
                    onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Risk Levels</option>
                    <option value="low">Low Risk (0-30)</option>
                    <option value="medium">Medium Risk (30-60)</option>
                    <option value="high">High Risk (60+)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => {
            const fundingProgress = getFundingProgress(invoice.totalInvestment, invoice.fundingGoal);
            const daysUntilDue = getDaysUntilDue(invoice.dueDate);
            
            return (
              <div key={invoice.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-gray-600">{invoice.seller.companyName || `${invoice.seller.firstName} ${invoice.seller.lastName}`}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(invoice.riskScore)}`}>
                      {getRiskLabel(invoice.riskScore)}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">{invoice.description}</p>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Amount
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Expected Return
                      </div>
                      <div className="font-semibold text-green-600">
                        {invoice.expectedReturn}%
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Due Date
                      </div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {formatDate(invoice.dueDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {daysUntilDue} days
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-gray-600 text-xs mb-1">
                        <Shield className="w-3 h-3 mr-1" />
                        Risk Score
                      </div>
                      <div className="font-semibold text-gray-900">
                        {invoice.riskScore}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* Funding Progress */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Funding Progress</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.totalInvestment, invoice.currency)} / {formatCurrency(invoice.fundingGoal, invoice.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${fundingProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{Math.round(fundingProgress)}% funded</span>
                    <span>{invoice.investmentCount} investors</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6">
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                      Invest Now
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPage;