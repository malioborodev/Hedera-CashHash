'use client';

import { useState, useEffect } from 'react';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface WalletInfo {
  accountId: string;
  publicKey: string;
  balance: string;
}

export function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      try {
        const response = await fetch('/api/wallet/status');
        if (response.ok) {
          const data = await response.json();
          if (data.connected) {
            setWalletInfo(data.wallet);
          }
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
      }
    };

    checkWalletConnection();
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data.wallet);
        toast({
          title: 'Wallet Connected',
          description: `Connected to ${data.wallet.accountId}`,
        });
      } else {
        throw new Error('Failed to connect wallet');
      }
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await fetch('/api/wallet/disconnect', { method: 'POST' });
      setWalletInfo(null);
      toast({
        title: 'Wallet Disconnected',
        description: 'Wallet has been disconnected successfully.',
      });
    } catch (error) {
      toast({
        title: 'Disconnection Failed',
        description: 'Unable to disconnect wallet.',
        variant: 'destructive',
      });
    }
  };

  if (walletInfo) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-sm">
          <p className="font-medium">{walletInfo.accountId}</p>
          <p className="text-xs text-muted-foreground">{walletInfo.balance} HBAR</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          className="text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="flex items-center space-x-2"
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </Button>
  );
}