import React, { useState } from 'react';
import { X, FileText, Calendar, User, Mail, Plus, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { ClientWithDocuments } from '../../hooks/useClients';
import { cn } from '../../lib/utils';

interface DocumentRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestData: {
    clientId: string;
    title: string;
    description?: string;
    documentTypes: string[];
    dueDate: string;
    sendEmail: boolean;
  }) => Promise<void>;
  clients: ClientWithDocuments[];
  loading?: boolean;
}

// Predefined document types that can be requested
const documentTypeOptions = [
  {
    id: 'tax-forms',
    name: 'Tax Forms',
    items: [
      { id: 'w2', name: 'W-2 Forms' },
      { id: '1099-misc', name: '1099-MISC Forms' },
      { id: '1099-int', name: '1099-INT Forms' },
      { id: '1099-div', name: '1099-DIV Forms' },
      { id: '1099-b', name: '1099-B Forms' },
      { id: '1098', name: '1098 Mortgage Interest' },
      { id: 'k1', name: 'Schedule K-1' },
    ]
  },
  {
    id: 'business',
    name: 'Business Documents',
    items: [
      { id: 'profit-loss', name: 'Profit & Loss Statement' },
      { id: 'balance-sheet', name: 'Balance Sheet' },
      { id: 'business-expenses', name: 'Business Expense Receipts' },
      { id: 'asset-purchases', name: 'Asset Purchase Documentation' },
      { id: 'vehicle-mileage', name: 'Vehicle Mileage Log' },
      { id: 'home-office', name: 'Home Office Documentation' },
    ]
  },
  {
    id: 'personal',
    name: 'Personal Documents',
    items: [
      { id: 'bank-statements', name: 'Bank Statements' },
      { id: 'charitable-donations', name: 'Charitable Donation Receipts' },
      { id: 'medical-expenses', name: 'Medical Expense Receipts' },
      { id: 'education-expenses', name: 'Education Expense Documentation' },
      { id: 'retirement-contributions', name: 'Retirement Contribution Statements' },
      { id: 'property-tax', name: 'Property Tax Statements' },
    ]
  },
  {
    id: 'other',
    name: 'Other Documents',
    items: [
      { id: 'prior-tax-returns', name: 'Prior Year Tax Returns' },
      { id: 'irs-notices', name: 'IRS Notices or Letters' },
      { id: 'estimated-tax-payments', name: 'Estimated Tax Payment Records' },
      { id: 'foreign-accounts', name: 'Foreign Account Statements' },
      { id: 'crypto-transactions', name: 'Cryptocurrency Transactions' },
    ]
  }
];

export function DocumentRequestDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  clients, 
  loading = false 
}: DocumentRequestDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    dueDate: '',
    sendEmail: true,
  });
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [customDocuments, setCustomDocuments] = useState<string[]>([]);
  const [customDocumentInput, setCustomDocumentInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate a default due date (14 days from now)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        clientId: '',
        title: '',
        description: '',
        dueDate: getDefaultDueDate(),
        sendEmail: true,
      });
      setSelectedDocuments([]);
      setCustomDocuments([]);
      setCustomDocumentInput('');
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleAddCustomDocument = () => {
    if (customDocumentInput.trim()) {
      setCustomDocuments(prev => [...prev, customDocumentInput.trim()]);
      setCustomDocumentInput('');
    }
  };

  const handleRemoveCustomDocument = (index: number) => {
    setCustomDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (selectedDocuments.length === 0 && customDocuments.length === 0) {
      newErrors.documents = 'Please select at least one document type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    
    try {
      // Combine selected predefined documents and custom documents
      const allDocumentTypes = [
        ...selectedDocuments.map(id => {
          // Find the document name from the predefined options
          for (const category of documentTypeOptions) {
            const item = category.items.find(item => item.id === id);
            if (item) return item.name;
          }
          return id; // Fallback to ID if name not found
        }),
        ...customDocuments
      ];
      
      await onSubmit({
        clientId: formData.clientId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        documentTypes: allDocumentTypes,
        dueDate: formData.dueDate,
        sendEmail: formData.sendEmail
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to create document request:', error);
      setErrors({ submit: 'Failed to create request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-2xl shadow-premium max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">New Document Request</h2>
              <p className="text-text-tertiary text-sm">
                {step === 1 ? 'Step 1: Request Details' : 'Step 2: Select Documents'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex-shrink-0 px-6 py-4 bg-surface border-b border-border-subtle">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
              step >= 1 ? "bg-primary text-gray-900" : "bg-surface-elevated text-text-tertiary border border-border-subtle"
            )}>
              1
            </div>
            <div className={cn(
              "flex-1 h-2 rounded-full transition-all duration-300",
              step >= 2 ? "bg-primary" : "bg-surface-elevated border border-border-subtle"
            )} />
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
              step >= 2 ? "bg-primary text-gray-900" : "bg-surface-elevated text-text-tertiary border border-border-subtle"
            )}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs font-medium text-text-secondary">Request Details</span>
            <span className="text-xs font-medium text-text-secondary">Select Documents</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="p-6 space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">Client *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-surface-elevated border ${
                      errors.clientId ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-border-subtle'
                    } rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200`}
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.clientId && (
                  <p className="text-sm text-red-600 font-medium" role="alert">
                    {errors.clientId}
                  </p>
                )}
              </div>

              {/* Request Title */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">Request Title *</label>
                <Input
                  placeholder="e.g., 2024 Tax Return Documents"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={errors.title}
                />
              </div>

              {/* Request Description */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">Description (Optional)</label>
                <textarea
                  placeholder="Provide additional details about the document request..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 resize-none"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">Due Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-12 pr-4 py-3 bg-surface-elevated border ${
                      errors.dueDate ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-border-subtle'
                    } rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200`}
                  />
                </div>
                {errors.dueDate && (
                  <p className="text-sm text-red-600 font-medium" role="alert">
                    {errors.dueDate}
                  </p>
                )}
              </div>

              {/* Send Email Option */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={formData.sendEmail}
                    onChange={(e) => handleInputChange('sendEmail', e.target.checked)}
                    className="w-4 h-4 text-primary bg-surface-elevated border-border-subtle rounded focus:ring-primary focus:ring-2"
                  />
                  <label htmlFor="sendEmail" className="text-sm font-medium text-text-primary">
                    Send email notification to client
                  </label>
                </div>
                <p className="text-xs text-text-tertiary ml-7">
                  An email will be sent to the client with a link to upload the requested documents
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Select Documents</h3>
                <p className="text-sm text-text-tertiary mb-6">
                  Choose the documents you need from your client. You can select from common document types or add custom document requests.
                </p>
              </div>

              {errors.documents && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-600 font-medium" role="alert">
                    {errors.documents}
                  </p>
                </div>
              )}

              <div className="space-y-8">
                {documentTypeOptions.map(category => (
                  <div key={category.id} className="space-y-4">
                    <h4 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {category.items.map(item => {
                        const isSelected = selectedDocuments.includes(item.id);
                        
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleDocumentToggle(item.id)}
                            className={cn(
                              "relative cursor-pointer rounded-xl border p-4 hover:shadow-medium transition-all duration-200 group",
                              isSelected 
                                ? "border-primary bg-primary/5 shadow-soft" 
                                : "border-border-subtle hover:border-border-light bg-surface-elevated"
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={cn(
                                "p-2 rounded-lg transition-all duration-200",
                                isSelected 
                                  ? "bg-primary text-gray-900" 
                                  : "bg-surface group-hover:bg-surface-hover"
                              )}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-sm text-text-primary">{item.name}</h5>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Custom Document Requests */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
                    Custom Document Requests
                  </h4>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter custom document name..."
                        value={customDocumentInput}
                        onChange={(e) => setCustomDocumentInput(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      icon={Plus}
                      onClick={handleAddCustomDocument}
                      disabled={!customDocumentInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {customDocuments.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {customDocuments.map((doc, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-border-subtle"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-text-tertiary" />
                            <span className="text-text-primary">{doc}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleRemoveCustomDocument(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedDocuments.length > 0 || customDocuments.length > 0 ? (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                  <h4 className="font-semibold text-sm text-text-primary mb-3">
                    Selected Documents ({selectedDocuments.length + customDocuments.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocuments.map(docId => {
                      // Find the document name from the predefined options
                      let docName = docId;
                      for (const category of documentTypeOptions) {
                        const item = category.items.find(item => item.id === docId);
                        if (item) {
                          docName = item.name;
                          break;
                        }
                      }
                      
                      return (
                        <span
                          key={docId}
                          className="inline-flex items-center px-3 py-1 rounded-lg bg-primary text-gray-900 text-xs font-semibold"
                        >
                          {docName}
                        </span>
                      );
                    })}
                    {customDocuments.map((doc, index) => (
                      <span
                        key={`custom-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-semibold"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-surface">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading || isSubmitting}
                className="w-full sm:w-auto sm:min-w-[100px]"
              >
                Cancel
              </Button>
              
              {step === 2 && (
                <Button
                  variant="secondary"
                  onClick={handleBack}
                  disabled={loading || isSubmitting}
                  className="w-full sm:w-auto sm:min-w-[100px]"
                >
                  ← Back
                </Button>
              )}
            </div>
            
            <div className="w-full sm:w-auto">
              {step === 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="w-full sm:w-auto shadow-medium sm:min-w-[180px] bg-primary text-gray-900 hover:bg-primary-hover"
                >
                  Next: Select Documents →
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || isSubmitting}
                  className="w-full sm:w-auto shadow-medium sm:min-w-[140px] bg-primary text-gray-900 hover:bg-primary-hover"
                >
                  {isSubmitting ? 'Creating...' : 'Create Request'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}