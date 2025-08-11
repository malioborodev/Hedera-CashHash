'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Shield, Clock, AlertTriangle, CheckCircle, X, Calculator } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  seller: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  buyer: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  dueDate: string;
  issueDate: string;
  description: string;
  riskScore: number;
  expectedReturnRate: number;
  fundingProgress: number;
  remainingAmount: number;
  minimumInvestment: number;
  maximumInvestment: number;
  maturityDate: string;
  industry?: string;
  paymentTerms: string;
}

interface InvestmentFormProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (investmentData: InvestmentData) => Promise<void>;
}

interface InvestmentData {
  invoiceId: string;
  amount: number;
  currency: string;
  expectedReturn: number;
  returnRate: number;
  maturityDate: string;
  riskAcknowledged: boolean;
  termsAccepted: boolean;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({
  invoice,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalculator, setShowCalculator] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInvestmentAmount('');
      setRiskAcknowledged(false);
      setTermsAccepted(false);
      setErrors({});
      setShowCalculator(false);
    }
  }, [isOpen]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const calculateExpectedReturn = (amount: number) => {
    return amount * (1 + invoice.expectedReturnRate);
  };

  const calculateProfit = (amount: number) => {
    return amount * invoice.expectedReturnRate;
  };

  const getDaysToMaturity = () => {
    const now = new Date();
    const maturity = new Date(invoice.maturityDate);
    const diffTime = maturity.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(investmentAmount);

    if (!investmentAmount || isNaN(amount)) {
      newErrors.amount = 'Please enter a valid investment amount';
    } else if (amount < invoice.minimumInvestment) {
      newErrors.amount = `Minimum investment is ${formatCurrency(invoice.minimumInvestment, invoice.currency)}`;
    } else if (amount > invoice.maximumInvestment) {
      newErrors.amount = `Maximum investment is ${formatCurrency(invoice.maximumInvestment, invoice.currency)}`;
    } else if (amount > invoice.remainingAmount) {
      newErrors.amount = `Only ${formatCurrency(invoice.remainingAmount, invoice.currency)} remaining for investment`;
    }

    if (!riskAcknowledged) {
      newErrors.risk = 'Please acknowledge the investment risks';
    }

    if (!termsAccepted) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(investmentAmount);
      const investmentData: InvestmentData = {
        invoiceId: invoice.id,
        amount,
        currency: invoice.currency,
        expectedReturn: calculateExpectedReturn(amount),
        returnRate: invoice.expectedReturnRate,
        maturityDate: invoice.maturityDate,
        riskAcknowledged,
        termsAccepted
      };

      await onSubmit(investmentData);
      onClose();
    } catch (error) {
      console.error('Investment submission failed:', error);
      setErrors({ submit: 'Failed to submit investment. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInvestmentAmount(value);
      // Clear amount error when user starts typing
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
    }
  };

  const setQuickAmount = (percentage: number) => {
    const amount = (invoice.remainingAmount * percentage).toFixed(2);
    setInvestmentAmount(amount);
  };

  if (!isOpen) return null;

  const amount = parseFloat(investmentAmount) || 0;
  const expectedReturn = calculateExpectedReturn(amount);
  const profit = calculateProfit(amount);
  const daysToMaturity = getDaysToMaturity();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invest in Invoice</h2>
            <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Invoice Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Amount:</span>
                    <span className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(invoice.remainingAmount, invoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Funding Progress:</span>
                    <span className="font-semibold">{invoice.fundingProgress.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Return:</span>
                    <span className="font-semibold text-green-600">
                      {formatPercentage(invoice.expectedReturnRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maturity Date:</span>
                    <span className="font-semibold">{formatDate(invoice.maturityDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days to Maturity:</span>
                    <span className="font-semibold">{daysToMaturity} days</span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Risk Assessment</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">Risk Score:</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(invoice.riskScore)}`}>
                      {invoice.riskScore}/100 - {getRiskLabel(invoice.riskScore)}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        invoice.riskScore < 30 ? 'bg-green-500' :
                        invoice.riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${invoice.riskScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Parties Involved</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Seller</div>
                    <div className="font-medium">
                      {invoice.seller.companyName || `${invoice.seller.firstName} ${invoice.seller.lastName}`}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Buyer</div>
                    <div className="font-medium">
                      {invoice.buyer.companyName || `${invoice.buyer.firstName} ${invoice.buyer.lastName}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Investment Form */}
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Details</h3>
                  
                  {/* Investment Amount */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Investment Amount ({invoice.currency})
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={investmentAmount}
                          onChange={handleAmountChange}
                          placeholder="0.00"
                          className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.amount ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                      )}
                    </div>

                    {/* Quick Amount Buttons */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Select
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0.25, 0.5, 0.75, 1.0].map((percentage) => (
                          <button
                            key={percentage}
                            type="button"
                            onClick={() => setQuickAmount(percentage)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                          >
                            {percentage === 1 ? 'Max' : `${(percentage * 100)}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Investment Limits */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Minimum: {formatCurrency(invoice.minimumInvestment, invoice.currency)}</div>
                      <div>Maximum: {formatCurrency(invoice.maximumInvestment, invoice.currency)}</div>
                      <div>Available: {formatCurrency(invoice.remainingAmount, invoice.currency)}</div>
                    </div>
                  </div>
                </div>

                {/* Investment Calculator */}
                {amount > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Investment Summary</h4>
                      <Calculator className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Investment Amount:</span>
                        <span className="font-semibold">{formatCurrency(amount, invoice.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Return:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(expectedReturn, invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(profit, invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Return Rate:</span>
                        <span className="font-semibold text-blue-600">
                          {formatPercentage(invoice.expectedReturnRate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Investment Period:</span>
                        <span className="font-semibold">{daysToMaturity} days</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Acknowledgment */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="riskAcknowledged"
                      checked={riskAcknowledged}
                      onChange={(e) => {
                        setRiskAcknowledged(e.target.checked);
                        if (errors.risk) {
                          setErrors(prev => ({ ...prev, risk: '' }));
                        }
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="riskAcknowledged" className="text-sm text-gray-700">
                      I acknowledge that this investment carries risks and I may lose some or all of my investment. 
                      I understand the risk score of {invoice.riskScore}/100 and accept the associated risks.
                    </label>
                  </div>
                  {errors.risk && (
                    <p className="text-sm text-red-600">{errors.risk}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (errors.terms) {
                          setErrors(prev => ({ ...prev, terms: '' }));
                        }
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                      I accept the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> and 
                      <a href="#" className="text-blue-600 hover:underline ml-1">Investment Agreement</a>.
                    </label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-600">{errors.terms}</p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-600">{errors.submit}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !investmentAmount || !riskAcknowledged || !termsAccepted}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        <span>Invest {amount > 0 ? formatCurrency(amount, invoice.currency) : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentForm;