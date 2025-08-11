'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

interface Investment {
  id: string;
  invoiceId: string;
  amount: number;
  yieldBPS: number;
  tenorDays: number;
  status: 'OPEN' | 'FUNDED' | 'PAID' | 'DEFAULTED';
  investedAt: string;
  maturityDate: string;
  expectedReturn: number;
  actualReturn: number;
}

interface PortfolioStats {
  totalInvested: number;
  totalReturns: number;
  activeInvestments: number;
  averageYield: number;
  pendingPayouts: number;
}

export function PortfolioView() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      
      // Get current user's address (this should come from wallet context)
      const userAddress = '0x123...'; // Replace with actual wallet address
      
      const response = await fetch(`/api/investments?investor=${userAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      const data = await response.json();
      setInvestments(data.investments || []);
      
      // Calculate portfolio stats
      const stats = calculatePortfolioStats(data.investments || []);
      setStats(stats);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load portfolio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioStats = (investments: Investment[]): PortfolioStats => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalReturns = investments.reduce((sum, inv) => sum + inv.actualReturn, 0);
    const activeInvestments = investments.filter(inv => inv.status === 'FUNDED').length;
    const averageYield = investments.length > 0 
      ? investments.reduce((sum, inv) => sum + inv.yieldBPS, 0) / investments.length / 100
      : 0;
    const pendingPayouts = investments.filter(inv => inv.status === 'FUNDED').length;

    return {
      totalInvested,
      totalReturns,
      activeInvestments,
      averageYield,
      pendingPayouts
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-500';
      case 'FUNDED':
        return 'bg-blue-500';
      case 'PAID':
        return 'bg-purple-500';
      case 'DEFAULTED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateDaysRemaining = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const prepareChartData = () => {
    const statusData = investments.reduce((acc, inv) => {
      const status = inv.status;
      acc[status] = (acc[status] || 0) + inv.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusData).map(([status, amount]) => ({
      name: status,
      value: amount,
      color: getStatusColor(status)
    }));
  };

  const preparePerformanceData = () => {
    // Mock performance data - in real app, this would come from historical data
    return [
      { month: 'Jan', returns: 0 },
      { month: 'Feb', returns: 2.3 },
      { month: 'Mar', returns: 4.1 },
      { month: 'Apr', returns: 6.8 },
      { month: 'May', returns: 8.9 },
      { month: 'Jun', returns: 11.2 },
    ];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground">No portfolio data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = prepareChartData();
  const performanceData = preparePerformanceData();

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalInvested)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalReturns)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent((stats.totalReturns / stats.totalInvested) * 100)} ROI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInvestments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(stats.averageYield)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Distribution</CardTitle>
            <CardDescription>Investment allocation by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Monthly returns progression</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatPercent(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="returns" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Investments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Investments</CardTitle>
          <CardDescription>Your current investment positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {investments.filter(inv => inv.status === 'FUNDED').map((investment) => (
              <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{investment.invoiceId}</h4>
                    <Badge className={getStatusColor(investment.status)}>
                      {investment.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Invested: {formatCurrency(investment.amount)} • 
                    Yield: {formatPercent(investment.yieldBPS / 100)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium">
                    {calculateDaysRemaining(investment.maturityDate)} days left
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expected: {formatCurrency(investment.expectedReturn)}
                  </div>
                </div>
              </div>
            ))}

            {investments.filter(inv => inv.status === 'FUNDED').length === 0 && (
              <div className="text-center py-8">
                <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active investments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start investing in bonds to see them here.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}