import React, { useState } from 'react';
import { TopBar } from '../components/organisms/TopBar';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { GlobalSearch } from '../components/molecules/GlobalSearch';
import { useSearch } from '../contexts/SearchContext';
import { WebinarRegistrationDialog } from '../components/ui/webinar-registration-dialog';
import { StatCard } from '../components/atoms/StatCard';
import { RegulatoryUpdateDialog } from '../components/ui/regulatory-update-dialog';
import { 
  GraduationCap, 
  Calendar, 
  Bell, 
  BookOpen, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  ExternalLink,
  Filter,
  Search,
  Plus,
  FileText,
  Zap
} from 'lucide-react';
import { Input } from '../components/atoms/Input';

export function MyZone() {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [searchQuery, setSearchQuery] = useState('');
  const { isSearchOpen, closeSearch } = useSearch();
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [selectedWebinar, setSelectedWebinar] = useState<any>(null);
  

  // Listen for register-webinar events from the regulatory update dialog
  React.useEffect(() => {
    const handleRegisterWebinar = (event: any) => {
      setSelectedWebinar(event.detail.webinar);
    };
    
    window.addEventListener('register-webinar', handleRegisterWebinar);
    
    return () => {
      window.removeEventListener('register-webinar', handleRegisterWebinar);
    };
  }, []);
  // Mock data for CPE credits
  const cpeCredits = {
    total: 40,
    completed: 28,
    required: 40,
    ethics: {
      completed: 1,
      required: 3
    },
    technical: {
      completed: 22,
      required: 30
    },
    other: {
      completed: 5,
      required: 7
    },
    deadline: '2025-12-31'
  };
  
  // Calculate days until deadline
  const deadlineDate = new Date(cpeCredits.deadline);
  const today = new Date();
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Mock data for upcoming webinars
  const upcomingWebinars = [
    {
      id: '1',
      title: 'Ethics in Tax Practice: 2025 Updates',
      date: '2025-07-15T14:00:00',
      duration: '2 hours',
      credits: 2,
      creditType: 'Ethics',
      price: 79,
      registered: false
    },
    {
      id: '2',
      title: 'Cryptocurrency Taxation: New IRS Guidelines',
      date: '2025-07-18T10:00:00',
      duration: '3 hours',
      credits: 3,
      creditType: 'Technical',
      price: 99,
      registered: true
    },
    {
      id: '3',
      title: 'AI Tools for Tax Professionals',
      date: '2025-07-22T13:00:00',
      duration: '1.5 hours',
      credits: 1.5,
      creditType: 'Technical',
      price: 59,
      registered: false
    },
    {
      id: '4',
      title: 'State Tax Updates for Remote Workers',
      date: '2025-07-25T11:00:00',
      duration: '2 hours',
      credits: 2,
      creditType: 'Technical',
      price: 79,
      registered: false
    }
  ];
  
  // Mock data for regulatory updates
  const regulatoryUpdates = [
    {
      id: '1',
      title: 'IRS Crypto Reporting Rule Passed',
      date: '2025-06-28',
      impact: 'High',
      description: 'New requirements for reporting cryptocurrency transactions over $10,000',
      requiredCredits: 1,
      creditType: 'Technical'
    },
    {
      id: '2',
      title: 'Updated Ethics Guidelines for Tax Preparers',
      date: '2025-06-25',
      impact: 'Medium',
      description: 'AICPA released new ethics guidelines for tax preparers regarding client confidentiality',
      requiredCredits: 2,
      creditType: 'Ethics'
    },
    {
      id: '3',
      title: 'State Tax Nexus Changes for Remote Work',
      date: '2025-06-20',
      impact: 'Medium',
      description: 'Multiple states have updated their nexus requirements for remote workers',
      requiredCredits: 1,
      creditType: 'Technical'
    }
  ];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
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
  
  // Calculate progress percentage
  const progressPercentage = (cpeCredits.completed / cpeCredits.required) * 100;
  
  // Create custom action for the TopBar to show the search and year selection UI
  const customAction = {
    label: "", // Empty label as we'll use custom rendering
    onClick: () => {}, // Empty handler as we'll use the component directly
    customRender: () => (
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 sm:mt-0">
        <div className="flex items-center space-x-3 bg-surface-elevated rounded-xl border border-border-subtle px-4 py-2 shadow-soft">
          <Calendar className="w-4 h-4 text-text-secondary" />
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-text-primary focus:outline-none"
          >
            <option value="2025">Reporting Year 2025</option>
            <option value="2024">Reporting Year 2024</option>
          </select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            placeholder="Search webinars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-surface-elevated shadow-soft border-border-subtle"
          />
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar 
        title="My Zone" 
        customAction={customAction}
      />

      {/* Global Search */}
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      
      <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* CPE Credits Overview */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">CPE Credits</h2>
              <p className="text-text-secondary mt-1">Tracking your continuing professional education</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                variant="secondary" 
                size="sm" 
                icon={FileText}
                className="mr-3"
              >
                Download Report
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                icon={Plus}
                className="bg-primary text-gray-900 hover:bg-primary-hover"
              >
                Add Credits
              </Button>
            </div>
          </div>
          
          {/* CPE Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total CPE Credits"
              value={`${cpeCredits.completed}/${cpeCredits.required}`}
              change={`${cpeCredits.required - cpeCredits.completed} more needed`}
              icon={GraduationCap}
              trend={progressPercentage >= 75 ? 'up' : progressPercentage >= 50 ? 'neutral' : 'warning'}
            />
            <StatCard
              title="Ethics Credits"
              value={`${cpeCredits.ethics.completed}/${cpeCredits.ethics.required}`}
              change={cpeCredits.ethics.completed < cpeCredits.ethics.required ? 'Attention needed' : 'Requirement met'}
              icon={BookOpen}
              trend={cpeCredits.ethics.completed >= cpeCredits.ethics.required ? 'up' : 'warning'}
            />
            <StatCard
              title="Technical Credits"
              value={`${cpeCredits.technical.completed}/${cpeCredits.technical.required}`}
              change={`${Math.round((cpeCredits.technical.completed / cpeCredits.technical.required) * 100)}% complete`}
              icon={TrendingUp}
              trend={cpeCredits.technical.completed >= cpeCredits.technical.required ? 'up' : 'neutral'}
            />
            <StatCard
              title="Days Until Deadline"
              value={daysUntilDeadline}
              change={`Deadline: ${formatDate(cpeCredits.deadline)}`}
              icon={Clock}
              trend={daysUntilDeadline > 90 ? 'up' : daysUntilDeadline > 30 ? 'neutral' : 'warning'}
            />
          </div>
          
          {/* Progress Bar */}
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">CPE Completion Progress</h3>
              <span className="text-sm font-medium text-text-tertiary">{cpeCredits.completed} of {cpeCredits.required} credits completed</span>
            </div>
            <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Credit Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-secondary">Ethics</span>
                  <span className="text-sm font-semibold text-text-primary">{cpeCredits.ethics.completed}/{cpeCredits.ethics.required}</span>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(cpeCredits.ethics.completed / cpeCredits.ethics.required) * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-secondary">Technical</span>
                  <span className="text-sm font-semibold text-text-primary">{cpeCredits.technical.completed}/{cpeCredits.technical.required}</span>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${(cpeCredits.technical.completed / cpeCredits.technical.required) * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-secondary">Other</span>
                  <span className="text-sm font-semibold text-text-primary">{cpeCredits.other.completed}/{cpeCredits.other.required}</span>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(cpeCredits.other.completed / cpeCredits.other.required) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Smart Credit Gap Analyzer */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-6 shadow-soft">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary rounded-xl shadow-soft">
                <Zap className="w-6 h-6 text-gray-900" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Smart Credit Gap Analysis</h3>
                <p className="text-text-secondary mb-4">Based on your current credits and requirements</p>
                
                <div className="bg-white/80 rounded-xl p-4 border border-border-subtle mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-text-primary">You need 2 more ethics credits by {formatDate(cpeCredits.deadline)}</span>
                  </div>
                  <p className="text-text-secondary text-sm mb-3">Complete these credits soon to meet your requirements.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {upcomingWebinars
                      .filter(webinar => webinar.creditType === 'Ethics')
                      .slice(0, 2)
                      .map(webinar => (
                        <div key={webinar.id} className="bg-surface rounded-lg p-3 border border-border-subtle">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-text-primary text-sm">{webinar.title}</h4>
                              <p className="text-xs text-text-tertiary mt-1">{formatDateTime(webinar.date)} • {webinar.duration}</p>
                            </div>
                            <Badge variant="success" size="sm">{webinar.credits} Credits</Badge>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-xs font-medium text-text-secondary">${webinar.price}</span>
                            <Button size="sm" variant="primary" className="text-xs py-1 px-3 bg-primary text-gray-900 hover:bg-primary-hover">
                              Register
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="bg-white/80 rounded-xl p-4 border border-border-subtle">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-text-primary">You need 8 more technical credits</span>
                  </div>
                  <p className="text-text-secondary text-sm mb-3">Recommended based on your practice specialty: Tax</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {upcomingWebinars
                      .filter(webinar => webinar.creditType === 'Technical' && !webinar.registered)
                      .slice(0, 2)
                      .map(webinar => (
                        <div key={webinar.id} className="bg-surface rounded-lg p-3 border border-border-subtle">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-text-primary text-sm">{webinar.title}</h4>
                              <p className="text-xs text-text-tertiary mt-1">{formatDateTime(webinar.date)} • {webinar.duration}</p>
                            </div>
                            <Badge variant="warning" size="sm">{webinar.credits} Credits</Badge>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-xs font-medium text-text-secondary">${webinar.price}</span>
                            <Button size="sm" variant="primary" className="text-xs py-1 px-3 bg-primary text-gray-900 hover:bg-primary-hover">
                              Register
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Webinars */}
          <div className="lg:col-span-2">
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
              <div className="p-6 border-b border-border-subtle">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">Upcoming Webinars</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={ExternalLink}
                    className="text-text-secondary"
                  >
                    View All
                  </Button>
                </div>
              </div>
              
              <div className="divide-y divide-border-subtle">
                {upcomingWebinars.map(webinar => (
                  <div key={webinar.id} className="p-6 hover:bg-surface-hover transition-colors duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-text-primary">{webinar.title}</h4>
                        <p className="text-text-tertiary text-sm mt-1">{formatDateTime(webinar.date)} • {webinar.duration}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getCreditTypeBadge(webinar.creditType)}
                        <Badge variant="success" size="sm">{webinar.credits} Credits</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-text-primary">${webinar.price}</span>
                        {webinar.registered && (
                          <Badge variant="success" size="sm">Registered</Badge>
                        )}
                      </div>
                      
                      {!webinar.registered && (
                        <Button 
                          size="sm" 
                          className="bg-primary text-gray-900 hover:bg-primary-hover"
                        >
                          Register Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Regulatory Intelligence */}
          <div className="lg:col-span-1">
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
              <div className="p-6 border-b border-border-subtle">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">Regulatory Updates</h3>
                  <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-amber-700">3 New</span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-border-subtle">
                {regulatoryUpdates.map(update => (
                  <div 
                    key={update.id} 
                    className="p-6 hover:bg-surface-hover transition-colors duration-200 cursor-pointer"
                    onClick={() => setSelectedUpdate(update)}
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="p-2 bg-surface rounded-lg border border-border-subtle">
                        <Bell className="w-4 h-4 text-text-tertiary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-text-primary">{update.title}</h4>
                          {getImpactBadge(update.impact)}
                        </div>
                        <p className="text-text-tertiary text-sm">{formatDate(update.date)}</p>
                      </div>
                    </div>
                    
                    <p className="text-text-secondary text-sm mb-3">{update.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-text-tertiary" />
                        <span className="text-xs text-text-secondary">{update.requiredCredits} {update.creditType} credits required</span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUpdate(update);
                        }}
                        className="text-xs"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 bg-surface border-t border-border-subtle">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  icon={Bell} 
                  className="w-full"
                >
                  Manage Notifications
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Regulatory Update Detail Dialog */}
      <RegulatoryUpdateDialog
        isOpen={!!selectedUpdate}
        onClose={() => setSelectedUpdate(null)}
        update={selectedUpdate}
        suggestedWebinars={upcomingWebinars.filter(webinar => 
          webinar.creditType === selectedUpdate?.creditType
        )}
      />
    </div>
  );
}