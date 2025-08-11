'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Activity, Coins, FileText, MessageSquare } from 'lucide-react';

interface HederaServiceStatus {
  hcs: boolean;
  hts: boolean;
  hfs: boolean;
  network: 'testnet' | 'mainnet';
  accountId?: string;
  balance?: string;
}

export function HederaStatusIndicator() {
  const [status, setStatus] = useState<HederaServiceStatus>({
    hcs: false,
    hts: false,
    hfs: false,
    network: 'testnet'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking Hedera services status
    const checkStatus = async () => {
      try {
        // In a real app, this would ping actual Hedera services
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStatus({
          hcs: true, // Consensus Service
          hts: true, // Token Service
          hfs: true, // File Service
          network: process.env.NEXT_PUBLIC_HEDERA_NETWORK as 'testnet' | 'mainnet' || 'testnet',
          accountId: '0.0.123456',
          balance: '1,234.56'
        });
      } catch (error) {
        console.error('Failed to check Hedera status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  const ServiceBadge = ({ service, isActive, label }: { service: string, isActive: boolean, label: string }) => (
    <div className="flex items-center space-x-2">
      {isActive ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm">{label}</span>
      <Badge variant={isActive ? "default" : "destructive"} className="ml-auto">
        {isActive ? "Active" : "Down"}
      </Badge>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 animate-pulse" />
            <span>Checking Hedera Services...</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span>Hedera Network Status</span>
          </div>
          <Badge variant={status.network === 'mainnet' ? "default" : "secondary"}>
            {status.network.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Account ID</p>
            <p className="font-mono text-sm">{status.accountId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="font-mono text-sm">{status.balance} HBAR</p>
          </div>
        </div>

        {/* Services Status */}
        <div className="space-y-3">
          <ServiceBadge 
            service="hcs" 
            isActive={status.hcs} 
            label="Consensus Service (HCS)" 
          />
          <ServiceBadge 
            service="hts" 
            isActive={status.hts} 
            label="Token Service (HTS)" 
          />
          <ServiceBadge 
            service="hfs" 
            isActive={status.hfs} 
            label="File Service (HFS)" 
          />
        </div>

        {/* Features */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Hedera-Native Features</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span>Real-time event tracking via HCS</span>
            </div>
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>Invoice tokenization via HTS</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span>Document storage via HFS</span>
            </div>
          </div>
        </div>

        {/* No Database Badge */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Data Storage</span>
            <Badge variant="outline" className="border-green-600 text-green-800 bg-green-50">
              100% Hedera-Native
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            No traditional database. All data stored on Hedera network.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}