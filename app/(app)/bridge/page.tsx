"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HederaStatusIndicator } from "@/components/ui/hedera-status";

interface ChainsResponse {
  success: boolean;
  chains: Record<string, { rpc: string; bridge: string }>;
}

interface ValidateResponse {
  success: boolean;
  validation: { isValid: boolean; errors: string[]; suggestions?: string[] };
}

export default function BridgePage() {
  const [chains, setChains] = useState<Record<string, { rpc: string; bridge: string }>>({});
  const [sourceChain, setSourceChain] = useState<string>("ethereum");
  const [targetChain, setTargetChain] = useState<string>("hedera");
  const [amount, setAmount] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [userAddress, setUserAddress] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch supported chains
    const loadChains = async () => {
      try {
        const res = await fetch("/api/relay/chains");
        const json = (await res.json()) as ChainsResponse;
        if (json.success) setChains(json.chains);
      } catch (e) {
        console.error("Failed to load chains", e);
      }
    };
    loadChains();
  }, []);

  const isToHedera = useMemo(() => targetChain === "hedera", [targetChain]);

  const handleValidate = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/relay/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceChain, targetChain, amount, tokenAddress })
      });
      const json = (await res.json()) as ValidateResponse;
      if (!json.success || !json.validation.isValid) {
        setStatus(`Invalid: ${(json.validation?.errors || []).join(", ")}`);
      } else {
        setStatus("Parameters look good.");
      }
    } catch (e) {
      setStatus("Validation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleBridge = async () => {
    setLoading(true);
    setStatus("");
    try {
      if (isToHedera) {
        const res = await fetch("/api/relay/bridge-to-hedera", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceChain,
            amount,
            userAddress,
            evmTokenAddress: tokenAddress
          })
        });
        const json = await res.json();
        if (json.success) {
          setStatus(`Bridged to Hedera. HederaTx: ${json.hederaTxId}`);
        } else {
          setStatus(json.error || "Bridge failed");
        }
      } else {
        const res = await fetch("/api/relay/bridge-from-hedera", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetChain,
            amount,
            hederaTokenId: tokenAddress,
            targetAddress: userAddress
          })
        });
        const json = await res.json();
        if (json.success) {
          setStatus(`Bridged from Hedera. EvmTx: ${json.evmTxHash}`);
        } else {
          setStatus(json.error || "Bridge failed");
        }
      }
    } catch (e) {
      setStatus("Bridge request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Hedera Relay Bridge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Source Chain</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={sourceChain}
                    onChange={(e) => setSourceChain(e.target.value)}
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="bsc">BSC</option>
                    <option value="polygon">Polygon</option>
                    <option value="hedera">Hedera</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Target Chain</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2"
                    value={targetChain}
                    onChange={(e) => setTargetChain(e.target.value)}
                  >
                    <option value="hedera">Hedera</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="bsc">BSC</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Amount</label>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Token Address {isToHedera ? "(EVM)" : "(Hedera token ID)"}</label>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder={isToHedera ? "0x..." : "0.0.xxxxx"}
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Your Address {isToHedera ? "(Hedera)" : "(EVM)"}</label>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder={isToHedera ? "0.0.xxxxx" : "0x..."}
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleValidate}
                  disabled={loading}
                  className="rounded-md bg-muted px-4 py-2 text-sm"
                >
                  Validate
                </button>
                <button
                  onClick={handleBridge}
                  disabled={loading}
                  className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
                >
                  {isToHedera ? "Bridge to Hedera" : "Bridge from Hedera"}
                </button>
              </div>

              {status && (
                <div className="text-sm text-muted-foreground">{status}</div>
              )}
            </CardContent>
            <CardFooter>
              <Badge variant="outline">Demo Mode Supported</Badge>
            </CardFooter>
          </Card>
        </div>
        <div className="space-y-4">
          <HederaStatusIndicator />
          <Card>
            <CardHeader>
              <CardTitle>Supported Chains</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.keys(chains).length === 0 ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                Object.entries(chains).map(([name, info]) => (
                  <div key={name} className="text-sm">
                    <div className="font-medium capitalize">{name}</div>
                    <div className="text-xs text-muted-foreground break-all">Bridge: {info.bridge}</div>
                    <div className="text-xs text-muted-foreground break-all">RPC: {info.rpc}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}