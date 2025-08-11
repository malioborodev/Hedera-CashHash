'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Users, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalInvestments: number;
  totalInvested: number;
  totalReturns: number;
  activeInvestments: number;
  pendingInvoices: number;
  completedInvoices: number;
  portfolioValue: number;
  monthlyGrowth: number;
  averageReturnRate: number;
  riskScore: number;
}

interface RecentActivity {
  id: string;
  type: 'investment' | 'invoice_created' | 'invoice_funded' | 'payment_received' | 'maturity';
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  date: string;
  status: 'success' | 'pending' | 'warning' | 'error';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

interface UpcomingEvent {
  id: string;
  type: 'maturity' | 'payment_due' | 'review_required';
  title: string;
  description: string;
  date: string;
  amount?: number;
  currency?: string;
  priority: 'high' | 'medium' | 'low';
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data for development
  const mockStats: DashboardStats = {
    totalInvestments: 12,
    totalInvested: 45000,
    totalReturns: 3240,
    activeInvestments: 8,
    pendingInvoices: 3,
    completedInvoices: 15,
    portfolioValue: 48240,
    monthlyGrowth: 0.072,
    averageReturnRate: 0.085,
    riskScore: 28
  };

  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'investment',
      title: 'Investment Made',
      description: 'Invested in INV-2024-001 from TechCorp Solutions',
      amount: 5000,
      currency: 'USD',
      date: '2024-02-15T10:30:00Z',
      status: 'success'
    },
    {
      id: '2',
      type: 'payment_received',
      title: 'Payment Received',
      description: 'Return payment from INV-2024-002',
      amount: 3240,
      currency: 'USD',
      date: '2024-02-14T14:20:00Z',
      status: 'success'
    },
    {
      id: '3',
      type: 'invoice_funded',
      title: 'Invoice Fully Funded',
      description: 'INV-2024-003 reached 100% funding',
      date: '2024-02-13T09:15:00Z',
      status: 'success'
    },
    {
      id: '4',
      type: 'investment',
      title: 'Investment Pending',
      description: 'Investment in INV-2024-004 awaiting confirmation',
      amount: 2500,
      currency: 'USD',
      date: '2024-02-12T16:45:00Z',
      status: 'pending'
    }
  ];

  const mockUpcomingEvents: UpcomingEvent[] = [
    {
      id: '1',
      type: 'maturity',
      title: 'Investment Maturity',
      description: 'INV-2024-001 reaches maturity',
      date: '2024-04-15T00:00:00Z',
      amount: 5425,
      currency: 'USD',
      priority: 'high'
    },
    {
      id: '2',
      type: 'payment_due',
      title: 'Payment Due',
      description: 'Expected payment from INV-2024-005',
      date: '2024-03-01T00:00:00Z',
      amount: 1800,
      currency: 'USD',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'review_required',
      title: 'Risk Review',
      description: 'Quarterly portfolio risk assessment',
      date: '2024-03-31T00:00:00Z',
      priority: 'low'
    }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be API calls
      // const [statsRes, activitiesRes, eventsRes] = await Promise.all([
      //   fetch(`/api/dashboard/stats?range=${timeRange}`),
      //   fetch('/api/dashboard/activities'),
      //   fetch('/api/dashboard/upcoming-events')
      // ]);
      
      // For now, use mock data
      setTimeout(() => {
        setStats(mockStats);
        setRecentActivities(mockActivities);
        setUpcomingEvents(mockUpcomingEvents);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `In ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'investment': return TrendingUp;
      case 'invoice_created': return FileText;
      case 'invoice_funded': return CheckCircle;
      case 'payment_received': return DollarSign;
      case 'maturity': return Clock;
      default: return Activity;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'browse-invoices',
      title: 'Browse Invoices',
      description: 'Find new investment opportunities',
      icon: FileText,
      color: 'bg-blue-600',
      action: () => console.log('Navigate to market')
    },
    {
      id: 'create-invoice',
      title: 'Create Invoice',
      description: 'List your invoice for funding',
      icon: Plus,
      color: 'bg-green-600',
      action: () => console.log('Navigate to create invoice')
    },
    {
      id: 'view-portfolio',
      title: 'View Portfolio',
      description: 'Check your investments',
      icon: Target,
      color: 'bg-purple-600',
      action: () => console.log('Navigate to portfolio')
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      description: 'Analyze your risk profile',
      icon: Shield,
      color: 'bg-orange-600',
      action: () => console.log('Navigate to risk assessment')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            onClick={fetchDashboardData}
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's your investment overview.</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.portfolioValue)}
                  </p>
                  <div className="flex items-center mt-2">
                    {stats.monthlyGrowth >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ml-1 ${
                      stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(Math.abs(stats.monthlyGrowth))}
                    </span>
                  </div>
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
                    {formatCurrency(stats.totalReturns)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Avg: {formatPercentage(stats.averageReturnRate)}
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
                  <p className="text-sm font-medium text-gray-600">Active Investments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeInvestments}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Total: {stats.totalInvestments}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.riskScore}/100</p>
                  <p className="text-sm text-green-600 mt-2">Low Risk</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{action.title}</h3>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                          <span className="text-xs text-gray-500">{formatDate(activity.date)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        {activity.amount && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {formatCurrency(activity.amount, activity.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className={`border-l-4 pl-4 py-3 ${getPriorityColor(event.priority)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 text-sm">{event.title}</h3>
                      <span className="text-xs text-gray-500">{formatRelativeDate(event.date)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    {event.amount && (
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(event.amount, event.currency)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Summary */}
            {stats && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Invested</span>
                    <span className="font-semibold">{formatCurrency(stats.totalInvested)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Net Profit</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(stats.totalReturns - stats.totalInvested)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-semibold text-blue-600">92%</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Portfolio Health</span>
                      <span className="text-green-600 font-semibold">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;