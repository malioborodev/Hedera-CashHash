"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if wallet is already connected
    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      setIsConnected(true);
      setAddress(savedAddress);
    }
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Mock wallet connection - replace with actual wallet integration
      const mockAddress = "0x742d35Cc6634C0532925a3b8D4e6D3b6e8d3e8A0";
      
      setTimeout(() => {
        setIsConnected(true);
        setAddress(mockAddress);
        localStorage.setItem("walletAddress", mockAddress);
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to your wallet",
        });
        setIsConnecting(false);
      }, 1000);
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress("");
    localStorage.removeItem("walletAddress");
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected your wallet",
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  if (isConnected) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={`border-violet-200 text-violet-700 hover:bg-violet-50 ${className}`}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="font-mono text-sm">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wallet Connected</DialogTitle>
            <DialogDescription>
              Your wallet is connected to CashHash
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-mono">{address}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="hover:bg-slate-200"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open("https://hashscan.io", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={disconnectWallet}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className={`bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white ${className}`}
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}