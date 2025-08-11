"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Upload,
  ExternalLink
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Investment {
  id: string;
  amount: number;
  expectedReturn: number;
  maturity: string;
  status: "active" | "paid" | "defaulted";
  invoiceId: string;
  investedDate: string;
}

interface Invoice {
  id: string;
  amount: number;
  funded: number;
  maturity: string;
  status: "listed" | "funded" | "paid" | "defaulted";
  buyer: string;
  yield: number;
}

const mockInvestments: Investment[] = [
  {
    id: "INV-001",
    amount: 10000,
    expectedReturn: 1250,
    maturity: "2024-03-15",
    status: "active",
    invoiceId: "INV-2024-001",
    investedDate: "2024-01-15"
  },
  {
    id: "INV-002",
    amount: 5000,
    expectedReturn: 750,
    maturity: "2024-02-28",
    status: "paid",
    invoiceId: "INV-2024-002",
    investedDate: "2024-01-10"
  },
  {
    id: "INV-003",
    amount: 7500,
    expectedReturn: 900,
    maturity: "2024-01-30",
    status: "defaulted",
    invoiceId: "INV-2024-003",
    investedDate: "2023-12-15"
  }
];

const mockInvoices: Invoice[] = [
  {
    id: "INV-2024-001",
    amount: 50000,
    funded: 85,
    maturity: "2024-03-15",
    status: "funded",
    buyer: "MegaCorp Ltd",
    yield: 12.5
  },
  {
    id: "INV-2024-002",
    amount: 25000,
    funded: 100,
    maturity: "2024-02-28",
    status: "paid",
    buyer: "TechStart Inc",
    yield: 15.2
  },
  {
    id: "INV-2024-004",
    amount: 75000,
    funded: 30,
    maturity: "2024-04-30",
    status: "listed",
    buyer: "GlobalTrade Co",
    yield: 18.8
  }
];

function InvestorKPIs() {
  const totalInvested = mockInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturn = mockInvestments.reduce((sum, inv) => sum + inv.expectedReturn, 0);
  const activeInvestments = mockInvestments.filter(inv => inv.status === "active").length;
  const defaultRate = (mockInvestments.filter(inv => inv.status === "defaulted").length / mockInvestments.length) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Total Invested</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalInvested.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Expected Return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">${totalReturn.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Active Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeInvestments}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Default Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{defaultRate.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExporterKPIs() {
  const totalListed = mockInvoices.length;
  const totalFunded = mockInvoices.reduce((sum, inv) => sum + (inv.amount * inv.funded / 100), 0);
  const totalPaid = mockInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const defaultRate = (mockInvoices.filter(inv => inv.status === "defaulted").length / mockInvoices.length) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Total Listed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalListed}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Total Funded</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalFunded.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Total Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Default Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{defaultRate.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: "Active", color: "bg-blue-100 text-blue-700" },
    paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700" },
    defaulted: { label: "Defaulted", color: "bg-red-100 text-red-700" },
    listed: { label: "Listed", color: "bg-violet-100 text-violet-700" },
    funded: { label: "Funded", color: "bg-amber-100 text-amber-700" }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  return <Badge className={config.color}>{config.label}</Badge>;
}

function InvestmentDetail({ investment }: { investment: Investment }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Investment Amount</Label>
          <p className="font-semibold">${investment.amount.toLocaleString()}</p>
        </div>
        <div>
          <Label>Expected Return</Label>
          <p className="font-semibold text-emerald-600">${investment.expectedReturn.toLocaleString()}</p>
        </div>
      </div>
      
      <div>
        <Label>Timeline</Label>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span>Invested</span>
            <span>{investment.investedDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Maturity</span>
            <span>{investment.maturity}</span>
          </div>
        </div>
      </div>
      
      <Button className="w-full">
        <ExternalLink className="w-4 h-4 mr-2" />
        View on HashScan
      </Button>
    </div>
  );
}

function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Invoice Amount</Label>
          <p className="font-semibold">${invoice.amount.toLocaleString()}</p>
        </div>
        <div>
          <Label>Funded %</Label>
          <p className="font-semibold">{invoice.funded}%</p>
        </div>
      </div>
      
      <div>
        <Label>Progress</Label>
        <Progress value={invoice.funded} className="h-2 mt-2" />
      </div>
      
      <div className="flex space-x-2">
        <Button variant="outline" className="flex-1">
          <Upload className="w-4 h-4 mr-2" />
          Upload Doc
        </Button>
        <Button variant="outline" className="flex-1">
          Record Payment
        </Button>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [view, setView] = useState<"investor" | "exporter">("investor");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Portfolio
        </h1>
        <p className="text-slate-600">Manage your investments and invoices</p>
      </div>

      <Tabs value={view} onValueChange={(value) => setView(value as "investor" | "exporter")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="investor">Investor View</TabsTrigger>
          <TabsTrigger value="exporter">Exporter View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="investor" className="space-y-6">
          <InvestorKPIs />
          
          <Card>
            <CardHeader>
              <CardTitle>My Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Invoice ID</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Est. Return</th>
                      <th className="text-left py-2">Maturity</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvestments.map((investment) => (
                      <tr key={investment.id} className="border-b">
                        <td className="py-3 font-mono">{investment.invoiceId}</td>
                        <td className="py-3">${investment.amount.toLocaleString()}</td>
                        <td className="py-3 text-emerald-600">${investment.expectedReturn.toLocaleString()}</td>
                        <td className="py-3">{investment.maturity}</td>
                        <td className="py-3">
                          <StatusBadge status={investment.status} />
                        </td>
                        <td className="py-3">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="ghost" size="sm">View</Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>Investment Details</SheetTitle>
                                <SheetDescription>
                                  {investment.invoiceId}
                                </SheetDescription>
                              </SheetHeader>
                              <InvestmentDetail investment={investment} />
                            </SheetContent>
                          </Sheet>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exporter" className="space-y-6">
          <ExporterKPIs />
          
          <Card>
            <CardHeader>
              <CardTitle>My Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Invoice ID</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Funded %</th>
                      <th className="text-left py-2">Maturity</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b">
                        <td className="py-3 font-mono">{invoice.id}</td>
                        <td className="py-3">${invoice.amount.toLocaleString()}</td>
                        <td className="py-3">{invoice.funded}%</td>
                        <td className="py-3">{invoice.maturity}</td>
                        <td className="py-3">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="py-3">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="ghost" size="sm">Manage</Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>Invoice Management</SheetTitle>
                                <SheetDescription>
                                  {invoice.id}
                                </SheetDescription>
                              </SheetHeader>
                              <InvoiceDetail invoice={invoice} />
                            </SheetContent>
                          </Sheet>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}