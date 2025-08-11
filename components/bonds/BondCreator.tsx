'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, DollarSign, Calendar, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const bondSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  yieldBPS: z.number().min(100).max(2000, 'Yield must be between 1% and 20%'),
  tenorDays: z.number().min(7).max(365, 'Tenor must be between 7 and 365 days'),
  exporter: z.string().min(1, 'Exporter address is required'),
  investor: z.string().min(1, 'Investor address is required'),
  description: z.string().optional(),
});

type BondFormData = z.infer<typeof bondSchema>;

export function BondCreator() {
  const [isCreating, setIsCreating] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BondFormData>({
    resolver: zodResolver(bondSchema)
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: BondFormData) => {
    setIsCreating(true);
    try {
      const formData = new FormData();
      
      // Add bond data
      formData.append('invoiceId', data.invoiceId);
      formData.append('amount', data.amount.toString());
      formData.append('yieldBPS', data.yieldBPS.toString());
      formData.append('tenorDays', data.tenorDays.toString());
      formData.append('exporter', data.exporter);
      formData.append('investor', data.investor);
      if (data.description) {
        formData.append('description', data.description);
      }

      // Add documents
      documents.forEach((doc, index) => {
        formData.append(`documents`, doc);
      });

      const response = await fetch('/api/bonds', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create bond');
      }

      const result = await response.json();
      
      toast({
        title: 'Bond Created',
        description: `Bond ${result.bondEvent.id} created successfully`,
      });

      reset();
      setDocuments([]);
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create bond. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Bond</CardTitle>
        <CardDescription>
          Create a new invoice-backed bond on the Hedera network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceId">Invoice ID</Label>
              <Input
                id="invoiceId"
                {...register('invoiceId')}
                placeholder="INV-2024-001"
              />
              {errors.invoiceId && (
                <p className="text-sm text-destructive">{errors.invoiceId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="10000"
                  className="pl-10"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yieldBPS">Yield (Basis Points)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="yieldBPS"
                  type="number"
                  {...register('yieldBPS', { valueAsNumber: true })}
                  placeholder="800"
                  className="pl-10"
                />
              </div>
              {errors.yieldBPS && (
                <p className="text-sm text-destructive">{errors.yieldBPS.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tenorDays">Tenor (Days)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tenorDays"
                  type="number"
                  {...register('tenorDays', { valueAsNumber: true })}
                  placeholder="90"
                  className="pl-10"
                />
              </div>
              {errors.tenorDays && (
                <p className="text-sm text-destructive">{errors.tenorDays.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exporter">Exporter Address</Label>
              <Input
                id="exporter"
                {...register('exporter')}
                placeholder="0x..."
              />
              {errors.exporter && (
                <p className="text-sm text-destructive">{errors.exporter.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="investor">Investor Address</Label>
              <Input
                id="investor"
                {...register('investor')}
                placeholder="0x..."
              />
              {errors.investor && (
                <p className="text-sm text-destructive">{errors.investor.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Additional details about this invoice..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="documents">Upload Documents</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <label htmlFor="documents" className="cursor-pointer text-primary hover:underline">
                    Click to upload
                  </label>
                  {' '}or drag and drop
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX up to 10MB
                </p>
              </div>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {documents.length > 0 && (
              <div className="mt-2 space-y-1">
                {documents.map((doc, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {doc.name}
                  </p>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating Bond...' : 'Create Bond'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}