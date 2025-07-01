import React from 'react';
import { X, Bell, GraduationCap, Calendar, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

interface RegulationWebinar {
  id: string;
  title: string;
  date: string;
  duration: string;
  credits: number;
  creditType: string;
  price: number;
  registered?: boolean;
}

interface RegulatoryUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  update: {
    id: string;
    title: string;
    date: string;
    impact: string;
    description: string;
    requiredCredits: number;
    creditType: string;
    fullContent?: string;
  } | null;
  suggestedWebinars: RegulationWebinar[];
  onRegisterWebinar?: (webinar: RegulationWebinar) => void;
}

export function RegulatoryUpdateDialog({
  isOpen,
  onClose,
  update,
  suggestedWebinars,
  onRegisterWebinar
}: RegulatoryUpdateDialogProps) {
  if (!isOpen || !update) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format date and time for display
  const formatDateTime = (dateTimeString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleString(undefined, options);
  };

  // Get impact badge color
  const getImpactBadge = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return <Badge variant="error" size="sm">High Impact</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium Impact</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low Impact</Badge>;
    }
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

  // Mock full content for the regulatory update
  const fullContent = update.fullContent || `
# ${update.title}

## Overview
${update.description}

## Key Changes
- New reporting requirements for all tax professionals
- Updated documentation standards for client records
- Modified deadlines for certain filings
- Additional disclosure requirements

## Impact on CPAs
This regulatory change will affect how CPAs handle client information and reporting requirements. All professionals must complete ${update.requiredCredits} ${update.creditType} credits to ensure compliance with the new standards.

## Compliance Deadline
All CPAs must be compliant with these new regulations by ${formatDate(update.date)}.

## Recommended Actions
1. Complete required continuing education
2. Update internal procedures
3. Notify clients of relevant changes
4. Review existing documentation for compliance
`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-2xl shadow-premium max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{update.title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                {getImpactBadge(update.impact)}
                <span className="text-sm text-text-tertiary">Published {formatDate(update.date)}</span>
              </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Section */}
          <div className="bg-surface rounded-xl p-6 border border-border-subtle">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary mb-2">Summary</h3>
                <p className="text-text-secondary">{update.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-surface-elevated rounded-lg">
                  <Calendar className="w-4 h-4 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Effective Date</p>
                  <p className="text-sm font-medium text-text-primary">{formatDate(update.date)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-surface-elevated rounded-lg">
                  <GraduationCap className="w-4 h-4 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Required Credits</p>
                  <p className="text-sm font-medium text-text-primary">{update.requiredCredits} {update.creditType}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-surface-elevated rounded-lg">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Compliance Deadline</p>
                  <p className="text-sm font-medium text-text-primary">30 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Content */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Detailed Information</h3>
            <div className="bg-surface rounded-xl p-6 border border-border-subtle prose prose-sm max-w-none">
              {fullContent.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('# ')) {
                  return <h2 key={index} className="text-xl font-bold text-text-primary mt-4 mb-3">{paragraph.substring(2)}</h2>;
                } else if (paragraph.startsWith('## ')) {
                  return <h3 key={index} className="text-lg font-semibold text-text-primary mt-4 mb-2">{paragraph.substring(3)}</h3>;
                } else if (paragraph.startsWith('- ')) {
                  return (
                    <ul key={index} className="list-disc pl-5 my-3">
                      {paragraph.split('\n').map((item, i) => (
                        <li key={i} className="text-text-secondary mb-1">{item.substring(2)}</li>
                      ))}
                    </ul>
                  );
                } else if (paragraph.startsWith('1. ')) {
                  return (
                    <ol key={index} className="list-decimal pl-5 my-3">
                      {paragraph.split('\n').map((item, i) => {
                        const match = item.match(/^\d+\.\s(.+)$/);
                        return match ? (
                          <li key={i} className="text-text-secondary mb-1">{match[1]}</li>
                        ) : null;
                      })}
                    </ol>
                  );
                } else {
                  return <p key={index} className="text-text-secondary mb-4">{paragraph}</p>;
                }
              })}
            </div>
          </div>

          {/* Suggested Webinars */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Recommended Webinars</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedWebinars.slice(0, 4).map(webinar => (
                <div key={webinar.id} className="bg-surface rounded-xl p-4 border border-border-subtle hover:shadow-medium transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-text-primary">{webinar.title}</h4>
                      <p className="text-xs text-text-tertiary mt-1">{formatDateTime(webinar.date)} • {webinar.duration}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getCreditTypeBadge(webinar.creditType)}
                      <Badge variant="success" size="sm">{webinar.credits} Credits</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-primary">${webinar.price}</span>
                    {webinar.registered ? (
                      <Badge variant="success" size="sm">Registered</Badge>
                    ) : (
                      <Button 
                        size="sm"
                        className="bg-primary text-gray-900 hover:bg-primary-hover"
                        onClick={() => onRegisterWebinar?.(webinar)}
                      >
                        Register
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-surface">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-sm text-text-tertiary">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span>Complete {update.requiredCredits} {update.creditType} credits to maintain compliance</span>
              </div>
            </div>
            
            <div className="flex space-x-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
              
              <Button
                variant="primary"
                icon={ExternalLink}
                className="flex-1 sm:flex-none bg-primary text-gray-900 hover:bg-primary-hover"
              >
                View Full Regulation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}