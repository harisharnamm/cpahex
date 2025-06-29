import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Tag, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';

interface AddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: {
    date: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    document?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function AddTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: AddTransactionDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    document: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const incomeCategories = [
    'Sales', 'Consulting', 'Services', 'Interest', 'Dividends', 'Rental', 'Royalties', 'Other Income'
  ];
  
  const expenseCategories = [
    'Office Supplies', 'Utilities', 'Rent', 'Software', 'Travel', 'Meals', 'Marketing', 
    'Professional Services', 'Insurance', 'Taxes', 'Salaries', 'Equipment', 'Other Expenses'
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || parseFloat(formData.amount.toString()) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit({
        date: formData.date,
        type: formData.type,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount.toString()),
        document: formData.document || undefined
      });
      
      // Reset form on success
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        category: '',
        description: '',
        amount: '',
        document: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: '',
      description: '',
      amount: '',
      document: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-2xl shadow-premium max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Add Transaction</h2>
              <p className="text-text-tertiary text-sm">Record a new financial transaction</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Transaction Type */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-text-primary">Transaction Type</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                    formData.type === 'income'
                      ? 'border-emerald-300 bg-emerald-50 shadow-soft'
                      : 'border-border-subtle hover:border-border-light bg-surface-elevated'
                  }`}
                  onClick={() => handleInputChange('type', 'income')}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-all duration-200 ${
                      formData.type === 'income'
                        ? 'bg-emerald-100'
                        : 'bg-surface'
                    }`}>
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-text-primary">Income</h4>
                      <p className="text-xs text-text-tertiary mt-1">Money received</p>
                    </div>
                  </div>
                </div>
                
                <div
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                    formData.type === 'expense'
                      ? 'border-red-300 bg-red-50 shadow-soft'
                      : 'border-border-subtle hover:border-border-light bg-surface-elevated'
                  }`}
                  onClick={() => handleInputChange('type', 'expense')}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-all duration-200 ${
                      formData.type === 'expense'
                        ? 'bg-red-100'
                        : 'bg-surface'
                    }`}>
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-text-primary">Expense</h4>
                      <p className="text-xs text-text-tertiary mt-1">Money spent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                  required
                />
              </div>
              {errors.date && (
                <p className="text-sm text-red-600 font-medium">{errors.date}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Category *</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                  required
                >
                  <option value="">Select a category</option>
                  {formData.type === 'income' ? (
                    incomeCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))
                  ) : (
                    expenseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))
                  )}
                </select>
              </div>
              {errors.category && (
                <p className="text-sm text-red-600 font-medium">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Description *</label>
              <Input
                placeholder="Enter transaction description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="pl-10"
                  error={errors.amount}
                />
              </div>
            </div>

            {/* Document Reference */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Document Reference</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <Input
                  placeholder="Enter document reference or ID"
                  value={formData.document}
                  onChange={(e) => handleInputChange('document', e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-text-tertiary">
                Optional: Link this transaction to a document (e.g., receipt, invoice)
              </p>
            </div>

            {/* Transaction Preview */}
            {formData.description && formData.amount && (
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <h4 className="font-semibold text-text-primary text-sm mb-3">Transaction Preview</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{formData.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant={formData.type === 'income' ? 'success' : 'error'} 
                        size="sm"
                      >
                        {formData.type === 'income' ? 'Income' : 'Expense'}
                      </Badge>
                      {formData.category && (
                        <span className="text-xs text-text-tertiary">{formData.category}</span>
                      )}
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    formData.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formData.type === 'income' ? '+' : '-'}${parseFloat(formData.amount.toString()).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-subtle bg-surface">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-primary text-gray-900 hover:bg-primary-hover"
              >
                {loading ? 'Adding...' : 'Add Transaction'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}