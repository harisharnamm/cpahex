import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendors } from '../hooks/useVendors';
import { TopBar } from '../components/organisms/TopBar';
import { Badge } from '../components/atoms/Badge';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Send, FileText, Search, Filter, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export function Hub1099() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { vendors, loading, error } = useVendors();

  const handleSendW9 = (vendor: any) => {
    // Create mailto link with pre-filled W-9 request
    const subject = encodeURIComponent(`W-9 Form Request - ${new Date().getFullYear()}`);
    const body = encodeURIComponent(`Dear ${vendor.name},\n\nWe need you to complete a W-9 form for our tax records. Please complete and return the attached form at your earliest convenience.\n\nThis form is required for us to issue a 1099 if your payments exceed $600 for the tax year.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\n[Your Name]`);
    
    if (vendor.email) {
      window.open(`mailto:${vendor.email}?subject=${subject}&body=${body}`, '_blank');
    } else {
      // Show notification that vendor has no email
      alert(`No email address on file for ${vendor.name}. Please update their contact information.`);
    }
  };

  const handleViewW9 = (vendor: any) => {
    if (vendor.w9_document_id) {
      // Navigate to document view - you could implement this to show the W-9 document
      console.log('View W-9 for vendor:', vendor.name);
      // For now, just show an alert
      alert(`W-9 document viewer would open for ${vendor.name}`);
    } else {
      alert(`No W-9 document on file for ${vendor.name}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">✓ Complete</Badge>;
      case 'pending':
        return <Badge variant="warning">⏳ Pending</Badge>;
      default:
        return <Badge variant="error">✗ Missing</Badge>;
    }
  };

  const completedCount = vendors.filter(v => v.w9_status === 'completed').length;
  const progressPercentage = (completedCount / vendors.length) * 100;

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar title="1099 Hub" />
      
      <div className="max-w-content mx-auto px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Completed</p>
                <p className="text-2xl font-semibold text-text-primary">{loading ? '...' : completedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Pending</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {loading ? '...' : vendors.filter(v => v.w9_status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Missing</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {loading ? '...' : vendors.filter(v => v.w9_status === 'missing').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Progress</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {loading ? '...' : Math.round(progressPercentage)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 mb-8 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">W-9 Collection Progress</h2>
            <span className="text-sm font-medium text-text-tertiary">{completedCount} of {vendors.length} completed</span>
          </div>
          <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Deadline Warning */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8 shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">1099 Deadline Approaching</p>
              <p className="text-amber-700 text-sm">45 days remaining. Ensure all W-9 forms are collected and verified.</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 mb-8 shadow-soft">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <Input
                placeholder="Search vendors by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            <Button variant="secondary" icon={Filter}>
              Filter
            </Button>
          </div>
        </div>

        {/* Vendor Table */}
        {loading ? (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-12 shadow-soft">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading vendors...</p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Vendor Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    W-9 Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Last Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-surface-hover transition-colors duration-200">
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {vendor.email}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(vendor.w9_status)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      ${vendor.total_paid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-sm">
                      {vendor.last_contact_date ? new Date(vendor.last_contact_date).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={Send}
                          onClick={() => handleSendW9(vendor)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          Send W-9
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={FileText}
                          onClick={() => handleViewW9(vendor)}
                          className="hover:bg-green-50 hover:text-green-600"
                        >
                          View W-9
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}