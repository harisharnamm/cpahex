import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Calendar, X } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { ClientWithDocuments } from '../../hooks/useClients';

interface EditClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxYear: number;
    entityType: string;
  }) => Promise<void>;
  client: ClientWithDocuments | null;
  loading?: boolean;
}

export function EditClientDialog({ isOpen, onClose, onSubmit, client, loading = false }: EditClientDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxYear: new Date().getFullYear(),
    entityType: 'individual'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        taxYear: client.tax_year || new Date().getFullYear(),
        entityType: client.entity_type || 'individual'
      });
    }
  }, [client]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        taxYear: formData.taxYear,
        entityType: formData.entityType,
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-surface-elevated rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-xl">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Edit Client</h2>
              <p className="text-text-tertiary text-sm">Update client information and details</p>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Client Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">Client Name *</label>
            <div className="relative">
              <Input
                placeholder="Enter client name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={loading}
                className="pl-12"
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">Email Address *</label>
            <div className="relative">
              <Input
                type="email"
                placeholder="client@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                className="pl-12"
              />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">Phone Number</label>
            <div className="relative">
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={loading}
                className="pl-12"
              />
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">Address</label>
            <div className="relative">
              <textarea
                placeholder="Enter client address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={loading}
                rows={3}
                className="w-full px-4 py-3 pl-12 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 resize-none"
              />
              <Building className="absolute left-4 top-3 w-4 h-4 text-text-tertiary" />
            </div>
          </div>

          {/* Tax Year and Entity Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Tax Year *</label>
              <div className="relative">
                <Input
                  type="number"
                  min="2020"
                  max={new Date().getFullYear() + 1}
                  value={formData.taxYear}
                  onChange={(e) => handleInputChange('taxYear', parseInt(e.target.value))}
                  disabled={loading}
                  className="pl-12"
                />
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              </div>
              {errors.taxYear && (
                <p className="text-sm text-red-600 font-medium">{errors.taxYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Entity Type</label>
              <select
                value={formData.entityType}
                onChange={(e) => handleInputChange('entityType', e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
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

        {/* Footer */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-border-subtle bg-surface">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto sm:min-w-[100px]"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto shadow-medium sm:min-w-[140px] bg-primary text-gray-900 hover:bg-primary-hover"
            >
              {loading ? 'Updating...' : '✓ Update Client'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}