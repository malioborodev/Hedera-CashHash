"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Calculator, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface UploadedFile {
  name: string;
  id: string;
  hash: string;
}

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [isBondPosted, setIsBondPosted] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    amount: "",
    buyer: "",
    maturity: "",
    country: "",
    description: "",
    yield: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const countries = [
    "Singapore", "Malaysia", "Thailand", "Indonesia", "Philippines", 
    "Vietnam", "India", "China", "Japan", "South Korea"
  ];

  const advanceRate = invoiceData.amount ? Math.min(90, 80 + (parseFloat(invoiceData.yield) || 0) * 0.5) : 0;
  const bondAmount = invoiceData.amount ? (parseFloat(invoiceData.amount) * advanceRate / 100) * 0.1 : 0;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const newFile: UploadedFile = {
          name: file.name,
          id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          hash: `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')}`
        };
        setUploadedFiles(prev => [...prev, newFile]);
        toast({
          title: "File Uploaded",
          description: `${file.name} has been uploaded successfully`,
        });
      });
    }
  };

  const handlePostBond = async () => {
    setStep(2);
    setTimeout(() => {
      setIsBondPosted(true);
      toast({
        title: "Bond Posted Successfully",
        description: `Bond of ${bondAmount.toFixed(2)} HBAR has been posted`,
      });
    }, 2000);
  };

  const handleListInvoice = async () => {
    setIsListing(true);
    setTimeout(() => {
      setIsListing(false);
      toast({
        title: "Invoice Listed Successfully",
        description: "Your invoice is now live on the market"
      });
      // Redirect to market with new invoice highlighted
      window.location.href = "/market";
    }, 2000);
  };

  const isDataComplete = invoiceData.amount && invoiceData.buyer && invoiceData.maturity && 
                        invoiceData.country && invoiceData.description && invoiceData.yield;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Create Invoice
        </h1>
        <p className="text-slate-600">List your trade finance invoice in minutes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Block */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Invoice Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Invoice Amount (USD)</Label>
              <Input
                type="number"
                value={invoiceData.amount}
                onChange={(e) => setInvoiceData({...invoiceData, amount: e.target.value})}
                placeholder="50,000"
              />
            </div>
            
            <div>
              <Label>Buyer Company</Label>
              <Input
                value={invoiceData.buyer}
                onChange={(e) => setInvoiceData({...invoiceData, buyer: e.target.value})}
                placeholder="MegaCorp Ltd"
              />
            </div>
            
            <div>
              <Label>Maturity Date</Label>
              <Input
                type="date"
                value={invoiceData.maturity}
                onChange={(e) => setInvoiceData({...invoiceData, maturity: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Country</Label>
              <Select value={invoiceData.country} onValueChange={(value) => setInvoiceData({...invoiceData, country: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={invoiceData.description}
                onChange={(e) => setInvoiceData({...invoiceData, description: e.target.value})}
                placeholder="Describe the trade transaction..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents Block */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Upload Documents</Label>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Upload invoice, purchase order, shipping docs, etc.
              </p>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files</Label>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-violet-600" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {file.id} • {file.hash.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(file.hash)}
                    >
                      Copy Hash
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms & Bond Block */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Terms & Bond</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Target Yield (%)</Label>
              <Input
                type="number"
                value={invoiceData.yield}
                onChange={(e) => setInvoiceData({...invoiceData, yield: e.target.value})}
                placeholder="12.5"
                step="0.1"
              />
            </div>
            
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm">Advance Rate:</span>
                <span className="font-semibold">{advanceRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Bond Required:</span>
                <span className="font-semibold">{bondAmount.toFixed(2)} HBAR</span>
              </div>
            </div>

            <div className="space-y-4">
              <Progress value={step * 33.33} className="h-2" />
              
              {step === 1 && (
                <Button 
                  onClick={handlePostBond}
                  disabled={!isDataComplete}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                >
                  Post Bond
                </Button>
              )}
              
              {step === 2 && (
                <div className="text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm text-emerald-600 font-medium">Bond Posted</p>
                  <Button 
                    onClick={handleListInvoice}
                    disabled={isListing}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  >
                    {isListing ? "Listing..." : "List Invoice"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}