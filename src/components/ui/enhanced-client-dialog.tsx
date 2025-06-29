import * as React from "react";
import { User, Mail, Phone, Building, Calendar, FileText, Receipt, CreditCard, Banknote, AlertTriangle, FileCheck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  InnerDialog,
  InnerDialogTrigger,
  InnerDialogContent,
  InnerDialogHeader,
  InnerDialogFooter,
  InnerDialogTitle,
  InnerDialogDescription,
} from "@/components/ui/nested-dialog";
import { cn } from "@/lib/utils";

interface ClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxYear: number;
    entityType: string;
    requiredDocuments: string[];
  }) => Promise<void>;
  loading?: boolean;
}

const documentTypes = [
  {
    id: 'w2',
    name: 'W-2 Forms',
    description: 'Wage and tax statements from employers',
    icon: FileText,
    category: 'income'
  },
  {
    id: '1099',
    name: '1099 Forms',
    description: 'Miscellaneous income statements',
    icon: Receipt,
    category: 'income'
  },
  {
    id: 'bank_statement',
    name: 'Bank Statements',
    description: 'Monthly bank account statements',
    icon: CreditCard,
    category: 'financial'
  },
  {
    id: 'receipt',
    name: 'Business Receipts',
    description: 'Receipts for business expenses',
    icon: Receipt,
    category: 'expenses'
  },
  {
    id: 'invoice',
    name: 'Invoices',
    description: 'Business invoices and billing documents',
    icon: FileCheck,
    category: 'business'
  },
  {
    id: 'irs_notice',
    name: 'IRS Notices',
    description: 'Letters and notices from the IRS',
    icon: AlertTriangle,
    category: 'compliance'
  },
  {
    id: 'w9',
    name: 'W-9 Forms',
    description: 'Vendor tax identification forms',
    icon: FileText,
    category: 'vendor'
  },
  {
    id: 'other',
    name: 'Other Documents',
    description: 'Additional tax-related documents',
    icon: FileText,
    category: 'other'
  }
];

export function EnhancedClientDialog({ isOpen, onClose, onSubmit, loading = false }: ClientDialogProps) {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxYear: new Date().getFullYear(),
    entityType: 'individual'
  });
  const [selectedDocuments, setSelectedDocuments] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.taxYear < 2020 || formData.taxYear > new Date().getFullYear() + 1) {
      newErrors.taxYear = 'Please enter a valid tax year';
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

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSubmit = async () => {
    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        taxYear: formData.taxYear,
        entityType: formData.entityType,
        requiredDocuments: selectedDocuments
      });
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        taxYear: new Date().getFullYear(),
        entityType: 'individual'
      });
      setSelectedDocuments([]);
      setErrors({});
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxYear: new Date().getFullYear(),
      entityType: 'individual'
    });
    setSelectedDocuments([]);
    setErrors({});
    setStep(1);
    onClose();
  };

  const getCategoryDocuments = (category: string) => {
    return documentTypes.filter(doc => doc.category === category);
  };

  const categories = [
    { id: 'income', name: 'Income Documents', color: 'emerald' },
    { id: 'financial', name: 'Financial Records', color: 'blue' },
    { id: 'expenses', name: 'Business Expenses', color: 'amber' },
    { id: 'business', name: 'Business Documents', color: 'purple' },
    { id: 'compliance', name: 'Tax Compliance', color: 'red' },
    { id: 'vendor', name: 'Vendor Forms', color: 'indigo' },
    { id: 'other', name: 'Other', color: 'gray' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-2xl">
        <DialogHeader className="border-b p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                {step === 1 ? 'Enter client information and details' : 'Select required documents for this client'}
              </DialogDescription>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mt-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              1
            </div>
            <div className={cn(
              "flex-1 h-1 rounded-full",
              step >= 2 ? "bg-primary" : "bg-muted"
            )} />
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              2
            </div>
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="p-6 space-y-6">
            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="Enter client name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <textarea
                  id="address"
                  placeholder="Enter client address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 resize-none"
                />
                <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Tax Year and Entity Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxYear">Tax Year *</Label>
                <div className="relative">
                  <Input
                    id="taxYear"
                    type="number"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                    value={formData.taxYear}
                    onChange={(e) => handleInputChange('taxYear', parseInt(e.target.value))}
                    disabled={loading}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                {errors.taxYear && (
                  <p className="text-sm text-destructive">{errors.taxYear}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityType">Entity Type</Label>
                <select
                  id="entityType"
                  value={formData.entityType}
                  onChange={(e) => handleInputChange('entityType', e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="individual">Individual</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="s_corp">S Corporation</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Required Documents</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the types of documents you'll need from this client for their tax preparation.
                </p>
              </div>

              <div className="space-y-6">
                {categories.map(category => {
                  const categoryDocs = getCategoryDocuments(category.id);
                  if (categoryDocs.length === 0) return null;

                  return (
                    <div key={category.id} className="space-y-3">
                      <h4 className="font-medium text-foreground text-sm uppercase tracking-wide">
                        {category.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categoryDocs.map(doc => {
                          const Icon = doc.icon;
                          const isSelected = selectedDocuments.includes(doc.id);
                          
                          return (
                            <div
                              key={doc.id}
                              onClick={() => handleDocumentToggle(doc.id)}
                              className={cn(
                                "relative cursor-pointer rounded-lg border p-4 hover:bg-accent transition-colors",
                                isSelected ? "border-primary bg-accent" : "border-input"
                              )}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm text-foreground">{doc.name}</h5>
                                  <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
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
                  );
                })}
              </div>

              {selectedDocuments.length > 0 && (
                <div className="bg-accent rounded-lg p-4">
                  <h4 className="font-medium text-sm text-foreground mb-2">
                    Selected Documents ({selectedDocuments.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocuments.map(docId => {
                      const doc = documentTypes.find(d => d.id === docId);
                      return doc ? (
                        <span
                          key={docId}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                        >
                          {doc.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col items-center justify-between space-y-2 border-t px-6 py-4 sm:flex-row sm:space-y-0">
          <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            
            {step === 1 && (
              <Button onClick={handleNext} className="w-full sm:w-auto" disabled={loading}>
                Next: Select Documents
              </Button>
            )}
            
            {step === 2 && (
              <>
                <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto" disabled={loading}>
                  Back
                </Button>
                <Button onClick={handleSubmit} className="w-full sm:w-auto" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Client'}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}