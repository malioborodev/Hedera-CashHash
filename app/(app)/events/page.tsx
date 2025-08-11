"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  TrendingUp,
  Shield
} from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  type: string;
  timestamp: string;
  invoiceId: string;
  description: string;
  txHash: string;
  payload: any;
}

const mockEvents: Event[] = [
  {
    id: "1",
    type: "LISTED",
    timestamp: "2024-01-15T10:30:00Z",
    invoiceId: "INV-2024-001",
    description: "Invoice listed on marketplace",
    txHash: "0x742d35cc6634c0532925a3b8d4e6d3b6e8d3e8a0",
    payload: { amount: 50000, yield: 12.5 }
  },
  {
    id: "2",
    type: "INVESTED",
    timestamp: "2024-01-15T14:20:00Z",
    invoiceId: "INV-2024-001",
    description: "Investor deposited $10,000",
    txHash: "0x8f4e2a1b9c7d3e5f6a8b9c0d1e2f3a4b5c6",
    payload: { amount: 10000, investor: "0x123..." }
  },
  {
    id: "3",
    type: "BOND_POSTED",
    timestamp: "2024-01-15T10:25:00Z",
    invoiceId: "INV-2024-001",
    description: "Exporter posted 5000 HBAR bond",
    txHash: "0x9a1b2c3d4e5f6789abcdef0123456789abcdef",
    payload: { bondAmount: 5000 }
  },
  {
    id: "4",
    type: "PAID",
    timestamp: "2024-01-14T16:45:00Z",
    invoiceId: "INV-2024-002",
    description: "Invoice fully paid to investors",
    txHash: "0xb1c2d3e4f5678901234567890abcdef123456",
    payload: { totalPaid: 28750 }
  },
  {
    id: "5",
    type: "DOC_UPLOADED",
    timestamp: "2024-01-14T12:15:00Z",
    invoiceId: "INV-2024-003",
    description: "Shipping documents uploaded",
    txHash: "0xc2d3e4f5678901234567890abcdef12345678",
    payload: { docType: "shipping", hash: "0xabc..." }
  }
];

function EventIcon({ type }: { type: string }) {
  const iconConfig = {
    LISTED: <FileText className="w-5 h-5" />,
    INVESTED: <TrendingUp className="w-5 h-5" />,
    BOND_POSTED: <Shield className="w-5 h-5" />,
    PAID: <CheckCircle className="w-5 h-5" />,
    DEFAULTED: <AlertTriangle className="w-5 h-5" />,
    DOC_UPLOADED: <Upload className="w-5 h-5" />
  };

  return iconConfig[type as keyof typeof iconConfig] || <Clock className="w-5 h-5" />;
}

function EventBadge({ type }: { type: string }) {
  const badgeConfig = {
    LISTED: { label: "Listed", color: "bg-violet-100 text-violet-700" },
    INVESTED: { label: "Invested", color: "bg-emerald-100 text-emerald-700" },
    BOND_POSTED: { label: "Bond Posted", color: "bg-blue-100 text-blue-700" },
    PAID: { label: "Paid", color: "bg-green-100 text-green-700" },
    DEFAULTED: { label: "Defaulted", color: "bg-red-100 text-red-700" },
    DOC_UPLOADED: { label: "Document", color: "bg-amber-100 text-amber-700" }
  };

  const config = badgeConfig[type as keyof typeof badgeConfig] || 
                 { label: type, color: "bg-slate-100 text-slate-700" };

  return <Badge className={config.color}>{config.label}</Badge>;
}

export default function EventsPage() {
  const [filterInvoice, setFilterInvoice] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filteredEvents = mockEvents.filter(event => {
    const matchesInvoice = !filterInvoice || event.invoiceId.toLowerCase().includes(filterInvoice.toLowerCase());
    const matchesType = filterType === "all" || event.type === filterType;
    return matchesInvoice && matchesType;
  });

  const eventTypes = ["all", "LISTED", "INVESTED", "BOND_POSTED", "PAID", "DEFAULTED", "DOC_UPLOADED"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Events
        </h1>
        <p className="text-slate-600">All platform activities and transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Invoice ID</Label>
              <Input
                placeholder="Search by invoice ID..."
                value={filterInvoice}
                onChange={(e) => setFilterInvoice(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Label>Event Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
        
        <div className="space-y-8">
          {filteredEvents.map((event) => (
            <div key={event.id} className="relative flex items-start">
              <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white border-2 border-slate-200 rounded-full">
                <div className="text-violet-600">
                  <EventIcon type={event.type} />
                </div>
              </div>
              
              <div className="ml-6 flex-1">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <EventBadge type={event.type} />
                        <span className="font-mono text-sm text-slate-600">{event.invoiceId}</span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {format(new Date(event.timestamp), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-slate-700 mb-2">{event.description}</p>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-slate-500">Transaction:</span>
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(event.txHash)}
                        className="h-6 px-2"
                      >
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://hashscan.io/mainnet/transaction/${event.txHash}`, '_blank')}
                        className="h-6 px-2"
                      >
                        View
                      </Button>
                    </div>
                    
                    {expandedEvent === event.id && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <Label className="text-sm">Payload</Label>
                        <pre className="text-xs mt-1 text-slate-600 overflow-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                      className="mt-2 h-6 px-2"
                    >
                      {expandedEvent === event.id ? "Collapse" : "Expand"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No events found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}