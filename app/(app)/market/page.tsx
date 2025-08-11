"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock,
  Filter,
  ArrowUpDown,
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface Invoice {
  id: string;
  amount: number;
  yield: number;
  tenor: number;
  bond: number;
  funded: number;
  daysLeft: number;
  risk: "low" | "medium" | "high";
  buyer: string;
  country: string;
}

const mockInvoices: Invoice[] = [
  {
    id: "INV-2024-001",
    amount: 50000,
    yield: 12.5,
    tenor: 90,
    bond: 5000,
    funded: 65,
    daysLeft: 15,
    risk: "low",
    buyer: "MegaCorp Ltd",
    country: "Singapore"
  },
  {
    id: "INV-2024-002",
    amount: 25000,
    yield: 15.2,
    tenor: 60,
    bond: 2500,
    funded: 30,
    daysLeft: 8,
    risk: "medium",
    buyer: "TechStart Inc",
    country: "Malaysia"
  },
  {
    id: "INV-2024-003",
    amount: 75000,
    yield: 18.8,
    tenor: 120,
    bond: 7500,
    funded: 80,
    daysLeft: 25,
    risk: "high",
    buyer: "GlobalTrade Co",
    country: "Thailand"
  }
];

function RiskBadge({ risk }: { risk: string }) {
  const riskConfig = {
    low: {
      label: "Low Risk",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: <Shield className="w-3 h-3" />
    },
    medium: {
      label: "Medium Risk",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: <AlertTriangle className="w-3 h-3" />
    },
    high: {
      label: "High Risk",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: <AlertTriangle className="w-3 h-3" />
    }
  };

  const config = riskConfig[risk as keyof typeof riskConfig];
  
  return (
    <Badge className={`${config.color} border flex items-center space-x-1`}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}

function InvestModal({ invoice }: { invoice: Invoice }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const maxAmount = invoice.amount - (invoice.amount * invoice.funded / 100);
  const estimatedReturn = amount ? parseFloat(amount) * (invoice.yield / 100) * (invoice.tenor / 365) : 0;
  const platformFee = amount ? parseFloat(amount) * 0.005 : 0;

  const handleInvest = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      toast({
        title: "Investment Successful",
        description: `Invested $${amount} in ${invoice.id}`,
      });
      setIsProcessing(false);
      setStep(4);
    }, 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700">
          Invest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in {invoice.id}</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? "Enter Amount" : step === 2 ? "Risk Acknowledgment" : "Confirm Investment"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Investment Amount (USD)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Max $${maxAmount.toLocaleString()}`}
                max={maxAmount}
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Estimated Return:</span>
                <span className="font-semibold text-emerald-600">${estimatedReturn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee (0.5%):</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Net Return:</span>
                <span className="text-emerald-600">${(estimatedReturn - platformFee).toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={() => setStep(2)} disabled={!amount} className="w-full">
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="risk1"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                />
                <Label htmlFor="risk1" className="text-sm">
                  I understand this investment carries risk and I may lose my principal
                </Label>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!agreed} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Invoice ID:</span>
                <span className="font-mono">{invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>${amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Return:</span>
                <span className="text-emerald-600">${(estimatedReturn - platformFee).toFixed(2)}</span>
              </div>
            </div>
            <Button 
              onClick={handleInvest} 
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
            >
              {isProcessing ? "Processing..." : "Confirm Investment"}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Investment Successful!</h3>
              <p className="text-sm text-slate-600">
                Your investment has been processed. Check your portfolio for updates.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function MarketPage() {
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("yield");

  const filteredInvoices = mockInvoices.filter(invoice => 
    filterRisk === "all" || invoice.risk === filterRisk
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Market
          </h1>
          <p className="text-slate-600">Browse and invest in trade finance invoices</p>
        </div>
      </div>

      <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-sm rounded-lg border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="text-sm border rounded-md px-3 py-1.5"
            >
              <option value="all">All Risks</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border rounded-md px-3 py-1.5"
            >
              <option value="yield">Highest Yield</option>
              <option value="amount">Largest Amount</option>
              <option value="daysLeft">Days Left</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{invoice.id}</h3>
                  <p className="text-sm text-slate-600">{invoice.buyer}</p>
                </div>
                <RiskBadge risk={invoice.risk} />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-slate-600">
                    <DollarSign className="w-3 h-3" />
                    <span>Amount</span>
                  </div>
                  <p className="font-semibold">${invoice.amount.toLocaleString()}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-slate-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>Yield</span>
                  </div>
                  <p className="font-semibold text-emerald-600">{invoice.yield}%</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-slate-600">
                    <Calendar className="w-3 h-3" />
                    <span>Tenor</span>
                  </div>
                  <p className="font-semibold">{invoice.tenor} days</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-slate-600">
                    <Shield className="w-3 h-3" />
                    <span>Bond</span>
                  </div>
                  <p className="font-semibold">{invoice.bond} HBAR</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Funded</span>
                  <span className="font-semibold">{invoice.funded}%</span>
                </div>
                <Progress value={invoice.funded} className="h-2" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>${((invoice.amount * invoice.funded) / 100).toLocaleString()} raised</span>
                  <span>${(invoice.amount - (invoice.amount * invoice.funded / 100)).toLocaleString()} remaining</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 text-sm text-slate-600">
                <Clock className="w-3 h-3" />
                <span>{invoice.daysLeft} days left</span>
              </div>
            </CardContent>
            
            <CardFooter className="flex space-x-2">
              <InvestModal invoice={invoice} />
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1" />
                Docs
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}