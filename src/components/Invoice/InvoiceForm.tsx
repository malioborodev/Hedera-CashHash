'use client';

import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Calendar, User, Building, AlertTriangle, CheckCircle, Upload, X, Plus, Trash2 } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceFormData {
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  issueDate: string;
  description: string;
  paymentTerms: string;
  industry: string;
  seller: {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    address: string;
    phone: string;
  };
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    address: string;
    phone: string;
  };
  items: InvoiceItem[];
  notes: string;
  attachments: File[];
  fundingSettings: {
    minimumInvestment: number;
    maximumInvestment: number;
    expectedReturnRate: number;
    fundingDeadline: string;
  };
}

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<InvoiceFormData>;
  isEdit?: boolean;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    amount: 0,
    currency: 'USD',
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
    paymentTerms: 'Net 30',
    industry: '',
    seller: {
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
      address: '',
      phone: ''
    },
    buyer: {
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
      address: '',
      phone: ''
    },
    items: [{
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }],
    notes: '',
    attachments: [],
    fundingSettings: {
      minimumInvestment: 100,
      maximumInvestment: 0,
      expectedReturnRate: 0.08,
      fundingDeadline: ''
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Invoice details and parties' },
    { id: 2, title: 'Invoice Items', description: 'Products or services' },
    { id: 3, title: 'Funding Settings', description: 'Investment parameters' },
    { id: 4, title: 'Review & Submit', description: 'Final review' }
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Construction',
    'Professional Services',
    'Transportation',
    'Energy',
    'Real Estate',
    'Other'
  ];

  const paymentTermsOptions = [
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
    'Due on Receipt',
    'Custom'
  ];

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  useEffect(() => {
    // Auto-generate invoice number if not provided
    if (!formData.invoiceNumber && !isEdit) {
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({
        ...prev,
        invoiceNumber: `INV-${new Date().getFullYear()}-${timestamp}`
      }));
    }
  }, []);

  useEffect(() => {
    // Calculate total amount from items
    const total = formData.items.reduce((sum, item) => sum + item.total, 0);
    setFormData(prev => ({ ...prev, amount: total }));
  }, [formData.items]);

  useEffect(() => {
    // Set default funding deadline to 30 days from issue date
    if (formData.issueDate && !formData.fundingSettings.fundingDeadline) {
      const deadline = new Date(formData.issueDate);
      deadline.setDate(deadline.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        fundingSettings: {
          ...prev.fundingSettings,
          fundingDeadline: deadline.toISOString().split('T')[0]
        }
      }));
    }
  }, [formData.issueDate]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleInputChange = (field: string, value: any) => {
    const keys = field.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    }
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.invoiceNumber) newErrors['invoiceNumber'] = 'Invoice number is required';
        if (!formData.description) newErrors['description'] = 'Description is required';
        if (!formData.dueDate) newErrors['dueDate'] = 'Due date is required';
        if (!formData.seller.firstName) newErrors['seller.firstName'] = 'Seller first name is required';
        if (!formData.seller.lastName) newErrors['seller.lastName'] = 'Seller last name is required';
        if (!formData.seller.email) newErrors['seller.email'] = 'Seller email is required';
        if (!formData.buyer.firstName) newErrors['buyer.firstName'] = 'Buyer first name is required';
        if (!formData.buyer.lastName) newErrors['buyer.lastName'] = 'Buyer last name is required';
        if (!formData.buyer.email) newErrors['buyer.email'] = 'Buyer email is required';
        break;
      
      case 2:
        if (formData.items.length === 0) {
          newErrors['items'] = 'At least one item is required';
        } else {
          formData.items.forEach((item, index) => {
            if (!item.description) newErrors[`items.${index}.description`] = 'Item description is required';
            if (item.quantity <= 0) newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
            if (item.unitPrice <= 0) newErrors[`items.${index}.unitPrice`] = 'Unit price must be greater than 0';
          });
        }
        break;
      
      case 3:
        if (formData.fundingSettings.minimumInvestment <= 0) {
          newErrors['fundingSettings.minimumInvestment'] = 'Minimum investment must be greater than 0';
        }
        if (formData.fundingSettings.maximumInvestment > 0 && 
            formData.fundingSettings.maximumInvestment < formData.fundingSettings.minimumInvestment) {
          newErrors['fundingSettings.maximumInvestment'] = 'Maximum investment must be greater than minimum';
        }
        if (formData.fundingSettings.expectedReturnRate <= 0 || formData.fundingSettings.expectedReturnRate > 1) {
          newErrors['fundingSettings.expectedReturnRate'] = 'Return rate must be between 0% and 100%';
        }
        if (!formData.fundingSettings.fundingDeadline) {
          newErrors['fundingSettings.fundingDeadline'] = 'Funding deadline is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    try {
      // Set maximum investment to invoice amount if not specified
      const finalData = {
        ...formData,
        fundingSettings: {
          ...formData.fundingSettings,
          maximumInvestment: formData.fundingSettings.maximumInvestment || formData.amount
        }
      };
      
      await onSubmit(finalData);
    } catch (error) {
      console.error('Form submission failed:', error);
      setErrors({ submit: 'Failed to submit invoice. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Basic Invoice Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.invoiceNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="INV-2024-001"
                  />
                  {errors.invoiceNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.dueDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paymentTermsOptions.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Brief description of goods or services provided"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Seller Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.seller.firstName}
                    onChange={(e) => handleInputChange('seller.firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['seller.firstName'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors['seller.firstName'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['seller.firstName']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.seller.lastName}
                    onChange={(e) => handleInputChange('seller.lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['seller.lastName'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors['seller.lastName'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['seller.lastName']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.seller.email}
                    onChange={(e) => handleInputChange('seller.email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['seller.email'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors['seller.email'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['seller.email']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.seller.companyName}
                    onChange={(e) => handleInputChange('seller.companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.seller.address}
                    onChange={(e) => handleInputChange('seller.address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Buyer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.buyer.firstName}
                    onChange={(e) => handleInputChange('buyer.firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['buyer.firstName'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors['buyer.firstName'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['buyer.firstName']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.buyer.lastName}
                    onChange={(e) => handleInputChange('buyer.lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['buyer.lastName'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors['buyer.lastName'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['buyer.lastName']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.buyer.email}
                    onChange={(e) => handleInputChange('buyer.email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['buyer.email'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors['buyer.email'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['buyer.email']}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.buyer.companyName}
                    onChange={(e) => handleInputChange('buyer.companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.buyer.address}
                    onChange={(e) => handleInputChange('buyer.address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[`items.${index}.description`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Product or service description"
                      />
                      {errors[`items.${index}.description`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.description`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[`items.${index}.quantity`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors[`items.${index}.quantity`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.quantity`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[`items.${index}.unitPrice`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors[`items.${index}.unitPrice`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.unitPrice`]}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-right">
                    <span className="text-lg font-semibold text-gray-900">
                      Total: {formatCurrency(item.total, formData.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  Invoice Total: {formatCurrency(formData.amount, formData.currency)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes or terms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload supporting documents</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Choose Files
                </label>
              </div>
              
              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Funding Settings</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Investment Parameters</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Configure how investors can participate in funding this invoice.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Investment ({formData.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.fundingSettings.minimumInvestment}
                  onChange={(e) => handleInputChange('fundingSettings.minimumInvestment', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['fundingSettings.minimumInvestment'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors['fundingSettings.minimumInvestment'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['fundingSettings.minimumInvestment']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Investment ({formData.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fundingSettings.maximumInvestment}
                  onChange={(e) => handleInputChange('fundingSettings.maximumInvestment', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['fundingSettings.maximumInvestment'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={`Leave empty for no limit (max: ${formatCurrency(formData.amount, formData.currency)})`}
                />
                {errors['fundingSettings.maximumInvestment'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['fundingSettings.maximumInvestment']}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to allow investments up to the full invoice amount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Return Rate (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={(formData.fundingSettings.expectedReturnRate * 100).toFixed(2)}
                  onChange={(e) => handleInputChange('fundingSettings.expectedReturnRate', (parseFloat(e.target.value) || 0) / 100)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['fundingSettings.expectedReturnRate'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors['fundingSettings.expectedReturnRate'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['fundingSettings.expectedReturnRate']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Deadline *
                </label>
                <input
                  type="date"
                  value={formData.fundingSettings.fundingDeadline}
                  onChange={(e) => handleInputChange('fundingSettings.fundingDeadline', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['fundingSettings.fundingDeadline'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors['fundingSettings.fundingDeadline'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['fundingSettings.fundingDeadline']}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Investment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Amount:</span>
                  <span className="font-semibold">{formatCurrency(formData.amount, formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Return Rate:</span>
                  <span className="font-semibold text-green-600">
                    {(formData.fundingSettings.expectedReturnRate * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Investment:</span>
                  <span className="font-semibold">
                    {formatCurrency(formData.fundingSettings.minimumInvestment, formData.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Maximum Investment:</span>
                  <span className="font-semibold">
                    {formData.fundingSettings.maximumInvestment > 0 
                      ? formatCurrency(formData.fundingSettings.maximumInvestment, formData.currency)
                      : 'No limit'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Ready to Submit</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Please review all information before submitting your invoice for funding.
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Invoice Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Invoice Number:</span>
                    <div className="font-medium">{formData.invoiceNumber}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Amount:</span>
                    <div className="font-medium text-lg">{formatCurrency(formData.amount, formData.currency)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <div className="font-medium">{new Date(formData.dueDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Expected Return:</span>
                    <div className="font-medium text-green-600">
                      {(formData.fundingSettings.expectedReturnRate * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Seller:</span>
                    <div className="font-medium">
                      {formData.seller.companyName || `${formData.seller.firstName} ${formData.seller.lastName}`}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Buyer:</span>
                    <div className="font-medium">
                      {formData.buyer.companyName || `${formData.buyer.firstName} ${formData.buyer.lastName}`}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Items:</span>
                    <div className="font-medium">{formData.items.length} item(s)</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Attachments:</span>
                    <div className="font-medium">{formData.attachments.length} file(s)</div>
                  </div>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
        </h1>
        <p className="text-gray-600 mt-1">Fill in the details to create your invoice for funding</p>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step.id 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 py-6">
        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}
        </div>
        
        <div>
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{isEdit ? 'Update Invoice' : 'Submit Invoice'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;