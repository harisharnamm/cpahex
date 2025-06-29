import React, { useState } from 'react';
import { X, Calendar, Clock, CreditCard, User, Mail, Building, Phone, CheckCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';

interface WebinarRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  webinar: {
    id: string;
    title: string;
    date: string;
    duration: string;
    credits: number;
    creditType: string;
    price: number;
  } | null;
  onRegister: (webinarId: string, formData: any) => Promise<void>;
}

export function WebinarRegistrationDialog({
  isOpen,
  onClose,
  webinar,
  onRegister
}: WebinarRegistrationDialogProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    paymentMethod: 'credit_card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    billingAddress: '',
    promoCode: ''
  });

  if (!isOpen || !webinar) return null;

  // Format date and time for display
  const formatDateTime = (dateTimeString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleString(undefined, options);
  };

  // Get credit type badge
  const getCreditTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ethics':
        return <Badge variant="error" size="sm">Ethics</Badge>;
      case 'technical':
        return <Badge variant="warning" size="sm">Technical</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onRegister(webinar.id, formData);
      setIsComplete(true);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setStep(1);
    setIsComplete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-2xl shadow-premium max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {isComplete ? 'Registration Complete' : 'Webinar Registration'}
              </h2>
              <p className="text-text-tertiary text-sm">
                {isComplete 
                  ? 'Your registration has been confirmed' 
                  : step === 1 
                    ? 'Step 1: Personal Information' 
                    : 'Step 2: Payment Details'}
              </p>
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
        <div className="flex-1 overflow-y-auto">
          {isComplete ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Registration Successful!</h3>
              <p className="text-text-secondary mb-6">
                You have successfully registered for the webinar. A confirmation email has been sent to {formData.email}.
              </p>
              
              <div className="bg-surface rounded-xl p-6 border border-border-subtle mb-6 text-left">
                <h4 className="font-semibold text-text-primary mb-3">Webinar Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Webinar:</span>
                    <span className="text-text-primary font-medium">{webinar.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Date & Time:</span>
                    <span className="text-text-primary font-medium">{formatDateTime(webinar.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Duration:</span>
                    <span className="text-text-primary font-medium">{webinar.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Credits:</span>
                    <div className="flex items-center space-x-2">
                      {getCreditTypeBadge(webinar.creditType)}
                      <Badge variant="success" size="sm">{webinar.credits} Credits</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 text-left">
                <h4 className="font-semibold text-text-primary mb-2">What's Next?</h4>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary font-bold">•</span>
                    <span>You'll receive a calendar invitation with the webinar link</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary font-bold">•</span>
                    <span>A reminder will be sent 24 hours before the webinar</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary font-bold">•</span>
                    <span>After completion, your CPE credits will be automatically added</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Webinar Info */}
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <h3 className="font-semibold text-text-primary mb-3">{webinar.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-text-tertiary" />
                    <div>
                      <p className="text-xs text-text-tertiary">Date & Time</p>
                      <p className="text-sm font-medium text-text-primary">{formatDateTime(webinar.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-text-tertiary" />
                    <div>
                      <p className="text-xs text-text-tertiary">Duration</p>
                      <p className="text-sm font-medium text-text-primary">{webinar.duration}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                  <div className="flex items-center space-x-2">
                    {getCreditTypeBadge(webinar.creditType)}
                    <Badge variant="success" size="sm">{webinar.credits} Credits</Badge>
                  </div>
                  <div className="text-lg font-semibold text-text-primary">${webinar.price}</div>
                </div>
              </div>

              {step === 1 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-text-primary">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-text-primary">First Name *</label>
                      <div className="relative">
                        <Input
                          placeholder="Enter your first name"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="pl-10"
                          required
                        />
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-text-primary">Last Name *</label>
                      <div className="relative">
                        <Input
                          placeholder="Enter your last name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="pl-10"
                          required
                        />
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-primary">Email Address *</label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-primary">Company</label>
                    <div className="relative">
                      <Input
                        placeholder="Enter your company name"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="pl-10"
                      />
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-primary">Phone Number</label>
                    <div className="relative">
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10"
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-text-primary">Payment Information</h3>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-primary">Payment Method</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div 
                        className={`p-4 border rounded-xl cursor-pointer flex items-center space-x-3 ${
                          formData.paymentMethod === 'credit_card' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border-subtle'
                        }`}
                        onClick={() => handleInputChange('paymentMethod', 'credit_card')}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.paymentMethod === 'credit_card' 
                            ? 'border-primary' 
                            : 'border-text-tertiary'
                        }`}>
                          {formData.paymentMethod === 'credit_card' && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <span className="text-text-primary">Credit Card</span>
                      </div>
                      
                      <div 
                        className={`p-4 border rounded-xl cursor-pointer flex items-center space-x-3 ${
                          formData.paymentMethod === 'invoice' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border-subtle'
                        }`}
                        onClick={() => handleInputChange('paymentMethod', 'invoice')}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.paymentMethod === 'invoice' 
                            ? 'border-primary' 
                            : 'border-text-tertiary'
                        }`}>
                          {formData.paymentMethod === 'invoice' && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <span className="text-text-primary">Invoice</span>
                      </div>
                    </div>
                  </div>
                  
                  {formData.paymentMethod === 'credit_card' && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-primary">Card Number *</label>
                        <div className="relative">
                          <Input
                            placeholder="1234 5678 9012 3456"
                            value={formData.cardNumber}
                            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                            className="pl-10"
                            required
                          />
                          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-text-primary">Expiration Date *</label>
                          <Input
                            placeholder="MM/YY"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-text-primary">CVC *</label>
                          <Input
                            placeholder="123"
                            value={formData.cardCvc}
                            onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-primary">Billing Address *</label>
                        <textarea
                          placeholder="Enter your billing address"
                          value={formData.billingAddress}
                          onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                          className="w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 resize-none"
                          rows={3}
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  {formData.paymentMethod === 'invoice' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-blue-800 text-sm">
                        An invoice will be sent to your email address. Payment must be received before the webinar date.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-primary">Promo Code</label>
                    <Input
                      placeholder="Enter promo code (if applicable)"
                      value={formData.promoCode}
                      onChange={(e) => handleInputChange('promoCode', e.target.value)}
                    />
                  </div>
                  
                  <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                    <h4 className="font-semibold text-text-primary mb-3">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Webinar Fee</span>
                        <span className="text-text-primary">${webinar.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Processing Fee</span>
                        <span className="text-text-primary">$0.00</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-border-subtle flex justify-between">
                        <span className="font-semibold text-text-primary">Total</span>
                        <span className="font-semibold text-text-primary">${webinar.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-surface">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {!isComplete && (
              <>
                <div className="w-full sm:w-auto">
                  {step === 1 ? (
                    <Button
                      variant="secondary"
                      onClick={handleClose}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto"
                    >
                      Back
                    </Button>
                  )}
                </div>
                
                <div className="w-full sm:w-auto">
                  {step === 1 ? (
                    <Button
                      onClick={handleNextStep}
                      className="w-full sm:w-auto bg-primary text-gray-900 hover:bg-primary-hover"
                      disabled={!formData.firstName || !formData.lastName || !formData.email}
                    >
                      Continue to Payment
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      className="w-full sm:w-auto bg-primary text-gray-900 hover:bg-primary-hover"
                      disabled={isSubmitting || (formData.paymentMethod === 'credit_card' && (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvc || !formData.billingAddress))}
                    >
                      {isSubmitting ? 'Processing...' : `Complete Registration • $${webinar.price}`}
                    </Button>
                  )}
                </div>
              </>
            )}
            
            {isComplete && (
              <div className="w-full flex justify-end">
                <Button
                  onClick={handleClose}
                  className="bg-primary text-gray-900 hover:bg-primary-hover"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}