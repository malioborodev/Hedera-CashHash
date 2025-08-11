'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, Shield, Eye, Download, Filter, Calendar, PieChart, BarChart3 } from 'lucide-react';

interface Investment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'active' | 'matured' | 'cancelled' | 'defaulted';
  investmentDate: string;
  maturityDate: string;
  expectedReturn: number;
  actualReturn: number;
  returnRate: number;
  riskScore: number;
  performanceScore?: number;
  seller: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  buyer: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
}

interface PortfolioSummary {
  totalInvestments: number;
  totalInvested: number;
  totalReturns: number;
  averageReturnRate: number;
  averageRiskScore: number;
  averagePerformanceScore: number;
  statusBreakdown: {
    status: string;
    count: number;
    totalAmount: number;
  }[];
}

const PortfolioPage: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'investments' | 'analytics'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('investmentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data for development
  const mockInvestments: Investment[] = [
    {
      id: '1',
      invoiceId: 'inv1',
      invoiceNumber: 'INV-2024-001',
      amount: 5000,
      currency: 'USD',
      status: 'active',
      investmentDate: '2024-01-15',
      maturityDate: '2024-04-15',
      expectedReturn: 5425,
      actualReturn: 0,
      returnRate: 0.085,
      riskScore: 25,
      performanceScore: 85,
      seller: {
        firstName: 'John',
        lastName: 'Smith',
        companyName: 'TechCorp Solutions'
      },
      buyer: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        companyName: 'Global Enterprises'
      }
    },
    {
      id: '2',
      invoiceId: 'inv2',
      invoiceNumber: 'INV-2024-002',
      amount: 3000,
      currency: 'USD',
      status: 'matured',
      investmentDate: '2023-12-01',
      maturityDate: '2024-02-01',
      expectedReturn: 3240,
      actualReturn: 3240,
      returnRate: 0.08,
      riskScore: 35,
      performanceScore: 92,
      seller: {
        firstName: 'Mike',
        lastName: 'Wilson',
        companyName: 'Industrial Supply Co'
      },
      buyer: {
        firstName: 'David',
        lastName: 'Brown',
        companyName: 'Manufacturing Inc'
      }
    },
    {
      id: '3',
      invoiceId: 'inv3',
      invoiceNumber: 'INV-2024-003',
      amount: 7500,
      currency: 'USD',
      status: 'pending',
      investmentDate: '2024-02-01',
      maturityDate: '2024-05-01',
      expectedReturn: 7987.5,
      actualReturn: 0,
      returnRate: 0.065,
      riskScore: 15,
      seller: {
        firstName: 'Emily',
        lastName: 'Davis',
        companyName: 'Strategic Consulting Group'
      },
      buyer: {
        firstName: 'Robert',
        lastName: 'Miller',
        companyName: 'Fortune 500 Corp'
      }
    }
  ];

  const mockSummary: PortfolioSummary = {
    totalInvestments: 3,
    totalInvested: 15500,
    totalReturns: 3240,
    averageReturnRate: 0.077,
    averageRiskScore: 25,
    averagePerformanceScore: 88.5,
    statusBreakdown: [
      { status: 'active', count: 1, totalAmount: 5000 },
      { status: 'matured', count: 1, totalAmount: 3000 },
      { status: 'pending', count: 1, totalAmount: 7500 }
    ]
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be API calls
      // const [investmentsRes, summaryRes] = await Promise.all([
      //   fetch('/api/investments/my'),
      //   fetch('/api/investments/summary')
      // ]);
      
      // For now, use mock data
      setTimeout(() => {
        setInvestments(mockInvestments);
        setSummary(mockSummary);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch portfolio data');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'matured': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'defaulted': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
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

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getDaysToMaturity = (maturityDate: string) => {
    const now = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredInvestments = investments.filter(investment => {
    if (statusFilter === 'all') return true;
    return investment.status === statusFilter;
  });

  const sortedInvestments = [...filteredInvestments].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Investment];
    let bValue: any = b[sortBy as keyof Investment];
    
    if (sortBy === 'investmentDate' || sortBy === 'maturityDate') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
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
            onClick={fetchPortfolioData}
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
              <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
              <p className="text-gray-600 mt-1">Track your investments and performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: PieChart },
                { id: 'investments', label: 'Investments', icon: DollarSign },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Invested</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.totalInvested, 'USD')}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Returns</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalReturns, 'USD')}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Return</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(summary.averageReturnRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Investments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalInvestments}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <PieChart className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Net Profit/Loss</span>
                    <span className={`font-semibold ${
                      summary.totalReturns - summary.totalInvested >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.totalReturns - summary.totalInvested, 'USD')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Risk Score</span>
                    <span className={`font-semibold ${getRiskColor(summary.averageRiskScore)}`}>
                      {summary.averageRiskScore.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Performance Score</span>
                    <span className="font-semibold text-blue-600">
                      {summary.averagePerformanceScore.toFixed(1)}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Status</h3>
                <div className="space-y-3">
                  {summary.statusBreakdown.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                        </div>
                        <span className="text-gray-600">({status.count})</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(status.totalAmount, 'USD')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === 'investments' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="matured">Matured</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="defaulted">Defaulted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-');
                        setSortBy(field);
                        setSortOrder(order as 'asc' | 'desc');
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="investmentDate-desc">Newest First</option>
                      <option value="investmentDate-asc">Oldest First</option>
                      <option value="amount-desc">Highest Amount</option>
                      <option value="amount-asc">Lowest Amount</option>
                      <option value="returnRate-desc">Highest Return</option>
                      <option value="riskScore-asc">Lowest Risk</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Investments List */}
            <div className="space-y-4">
              {sortedInvestments.map((investment) => {
                const daysToMaturity = getDaysToMaturity(investment.maturityDate);
                const isMatured = investment.status === 'matured';
                const profit = investment.actualReturn - investment.amount;
                
                return (
                  <div key={investment.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{investment.invoiceNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {investment.seller.companyName || `${investment.seller.firstName} ${investment.seller.lastName}`}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(investment.status)}`}>
                        {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Investment</div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(investment.amount, investment.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Expected Return</div>
                        <div className="font-semibold text-blue-600">
                          {formatCurrency(investment.expectedReturn, investment.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Return Rate</div>
                        <div className="font-semibold text-green-600">
                          {formatPercentage(investment.returnRate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Risk Score</div>
                        <div className={`font-semibold ${getRiskColor(investment.riskScore)}`}>
                          {investment.riskScore}/100
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Maturity</div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatDate(investment.maturityDate)}
                        </div>
                        {!isMatured && (
                          <div className="text-xs text-gray-500">
                            {daysToMaturity > 0 ? `${daysToMaturity} days` : 'Overdue'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          {isMatured ? 'Profit/Loss' : 'Current Value'}
                        </div>
                        <div className={`font-semibold ${
                          isMatured 
                            ? (profit >= 0 ? 'text-green-600' : 'text-red-600')
                            : 'text-gray-900'
                        }`}>
                          {isMatured 
                            ? formatCurrency(profit, investment.currency)
                            : formatCurrency(investment.amount, investment.currency)
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Invested on {formatDate(investment.investmentDate)}
                        {investment.performanceScore && (
                          <span className="ml-4">
                            Performance: <span className="font-medium text-blue-600">{investment.performanceScore}/100</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        {investment.status === 'pending' && (
                          <button className="text-red-600 hover:text-red-700">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedInvestments.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No investments found</div>
                <p className="text-gray-400">Try adjusting your filters or make your first investment</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Analytics</h3>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 text-lg mb-2">Analytics Coming Soon</div>
                <p className="text-gray-400">Detailed charts and analytics will be available here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;