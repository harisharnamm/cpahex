import React, { useState } from 'react';
import { X, User, Mail, Phone, Building, Calendar } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';

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
  }) => Promise<void>;
  loading?: boolean;
}

export function ClientDialog({ isOpen, onClose, onSubmit, loading = false }: ClientDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxYear: new Date().getFullYear(),
    entityType: 'individual'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        taxYear: formData.taxYear,
        entityType: formData.entityType
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
      setErrors({});
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
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-surface-elevated rounded-2xl border border-border-subtle shadow-premium w-full max-w-lg mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Add New Client</h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Name */}
          <div>
            <Input
              label="Client Name *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Enter client name"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              placeholder="client@example.com"
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div>
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter client address"
              rows={3}
              disabled={loading}
              className="w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 hover:border-border-light resize-none"
            />
          </div>

          {/* Tax Year and Entity Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Tax Year *
              </label>
              <input
                type="number"
                value={formData.taxYear}
                onChange={(e) => handleInputChange('taxYear', parseInt(e.target.value))}
                min="2020"
                max={new Date().getFullYear() + 1}
                disabled={loading}
                className="w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 hover:border-border-light"
              />
              {errors.taxYear && (
                <p className="text-sm text-red-600 font-medium mt-1" role="alert">
                  {errors.taxYear}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Entity Type
              </label>
              <select
                value={formData.entityType}
                onChange={(e) => handleInputChange('entityType', e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 hover:border-border-light"
              >
                <option value="individual">Individual</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
                <option value="s_corp">S Corporation</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}