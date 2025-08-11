'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Calendar, DollarSign, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

interface Bond {
  id: string;
  invoiceId: string;
  amount: number;
  yieldBPS: number;
  tenorDays: number;
  exporter: string;
  investor: string;
  status: 'OPEN' | 'FUNDED' | 'PAID' | 'DEFAULTED';
  createdAt: string;
  maturityDate: string;
  currentInvestment: number;
  totalInvestors: number;
}

export function BondMarketplace() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'funded'>('all');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchBonds();
  }, [filter]);

  const fetchBonds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter.toUpperCase());
      }

      const response = await fetch(`/api/bonds?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bonds');
      }

      const data = await response.json();
      setBonds(data.bonds || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load bonds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateDaysRemaining = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const filteredBonds = bonds.filter((bond) => {
    if (filter === 'all') return true;
    return bond.status.toLowerCase() === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bond Marketplace</h2>
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Bonds
          </Button>
          <Button
            variant={filter === 'open' ? 'default' : 'outline'}
            onClick={() => setFilter('open')}
          >
            Open
          </Button>
          <Button
            variant={filter === 'funded' ? 'default' : 'outline'}
            onClick={() => setFilter('funded')}
          >
            Funded
          </Button>
        </div>
      </div>

      {filteredBonds.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bonds found</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no bonds matching your criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBonds.map((bond) => (
            <Card key={bond.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{bond.invoiceId}</CardTitle>
                  <Badge className={getStatusColor(bond.status)}>
                    {bond.status}
                  </Badge>
                </div>
                <CardDescription>
                  Invoice-backed investment opportunity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-medium">{formatCurrency(bond.amount)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Yield</p>
                      <p className="font-medium">{bond.yieldBPS / 100}%</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tenor</p>
                      <p className="font-medium">{bond.tenorDays} days</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Days Left</p>
                      <p className="font-medium">
                        {calculateDaysRemaining(bond.maturityDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Investors</p>
                    <p className="font-medium">{bond.totalInvestors}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Exporter</p>
                    <p className="text-sm font-medium">
                      {formatAddress(bond.exporter)}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => router.push(`/bonds/${bond.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}