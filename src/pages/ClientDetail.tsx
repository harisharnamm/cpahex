import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { useClients } from '../hooks/useClients';
import { EditClientDialog } from '../components/ui/edit-client-dialog';
import { TopBar } from '../components/organisms/TopBar';
import { Search, Filter, FileText, Calendar, User, Upload, Download, Eye, Edit } from 'lucide-react';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { EnhancedFileUpload } from '../components/ui/enhanced-file-upload';
import { useDocuments } from '../hooks/useDocuments';
import { DOCUMENT_TYPE_LABELS } from '../types/documents';

export function ClientDetail() {
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState(0);
  const { clients, loading: clientsLoading, updateClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Use our document hooks
  const { documents, loading, downloadDocument, deleteDocument, getDocumentPreviewURL } = useDocuments(id);
  
  const tabs = ['Documents', 'Vendors', 'Notes'];
  
  // Find the actual client based on the ID from the URL
  const client = clients.find(c => c.id === id);
  
  // Show loading if we're still fetching clients or if client not found
  if (clientsLoading || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
        <TopBar title="Loading..." />
        <div className="max-w-content mx-auto px-8 py-8">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">
              {clientsLoading ? 'Loading client details...' : 'Client not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const vendors = [
    { id: '1', name: 'Office Depot', amount: 1250, w9Status: 'completed' },
    { id: '2', name: 'Marketing Co', amount: 3500, w9Status: 'pending' },
  ];

  const handleUploadComplete = (documentIds: string[]) => {
    console.log('Documents uploaded successfully:', documentIds);
    setShowUpload(false);
    // Documents will automatically refresh via the hook
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // Show error message to user
  };

  const handleDownload = (docId: string, filename: string) => {
    downloadDocument(docId, filename);
  };

  const handlePreview = async (docId: string) => {
    const { url } = await getDocumentPreviewURL(docId);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleEditClient = async (clientData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxYear: number;
    entityType: string;
  }) => {
    if (!client) return;
    
    setIsUpdating(true);
    try {
      await updateClient(client.id, {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        tax_year: clientData.taxYear,
        entity_type: clientData.entityType as any,
      });
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to update client:', error);
      throw error; // Re-throw to let the dialog handle the error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar
        title={client.name}
        breadcrumbItems={[
          { label: 'Clients', href: '/clients' },
          { label: client.name },
        ]}
        action={{
          label: 'Edit Client',
          onClick: () => setShowEditDialog(true),
          icon: Edit
        }}
      />
      
      <div className="max-w-content mx-auto px-8 py-8">
        {/* Client Info Card */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 mb-8 shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Contact</p>
                <p className="text-sm font-semibold text-text-primary">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Documents</p>
                <p className="text-sm font-semibold text-text-primary">{documents.length} files</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Tax Year</p>
                <p className="text-sm font-semibold text-text-primary">{client.tax_year}</p>
              </div>
            </div>
          </div>
        </div>

        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-2xl bg-surface-elevated border border-border-subtle p-2 mb-8 shadow-soft">
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `w-full rounded-xl py-3 text-sm font-semibold leading-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    selected
                      ? 'bg-gradient-to-r from-primary to-primary-hover text-gray-900 shadow-soft'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel className="space-y-6">
              {/* Enhanced Upload Zone */}
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden shadow-soft">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">Upload Documents</h3>
                      <p className="text-text-tertiary">Drag and drop files or click to browse</p>
                    </div>
                    <Button
                      onClick={() => setShowUpload(!showUpload)}
                      icon={Upload}
                      variant={showUpload ? "secondary" : "primary"}
                    >
                      {showUpload ? "Hide Upload" : "Upload Files"}
                    </Button>
                  </div>
                  
                  {showUpload && (
                    <EnhancedFileUpload
                      clientId={id}
                      allowMultiple={true}
                      onUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                    />
                  )}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input
                      placeholder="Search OCR text or filename"
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

              {/* Document Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft animate-pulse">
                      <div className="aspect-square bg-surface rounded-xl mb-4"></div>
                      <div className="h-4 bg-surface rounded mb-2"></div>
                      <div className="h-3 bg-surface rounded w-2/3"></div>
                    </div>
                  ))
                ) : documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.id} className="group bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-200">
                      <div className="aspect-square bg-surface rounded-xl mb-4 flex items-center justify-center border border-border-subtle">
                        <FileText className="w-8 h-8 text-text-tertiary" />
                      </div>
                      <h3 className="font-semibold text-text-primary truncate mb-2" title={doc.original_filename}>
                        {doc.original_filename}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="neutral" size="sm">
                          {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-text-tertiary">
                          {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary mb-4">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      
                      {/* Document Actions */}
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Eye}
                          onClick={() => handlePreview(doc.id)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Download}
                          onClick={() => handleDownload(doc.id, doc.original_filename)}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Empty state
                  <div className="col-span-full bg-surface-elevated rounded-2xl border border-border-subtle p-12 text-center shadow-soft">
                    <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Documents Yet</h3>
                    <p className="text-text-tertiary mb-4">Upload documents to get started</p>
                    <Button onClick={() => setShowUpload(true)} icon={Upload}>
                      Upload First Document
                    </Button>
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 shadow-soft">
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Vendor Management</h3>
                  <p className="text-text-tertiary">Track vendor payments and W-9 status</p>
                  
                  <div className="mt-8 space-y-4">
                    {vendors.map((vendor) => (
                      <div key={vendor.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border-subtle">
                        <div>
                          <p className="font-medium text-text-primary">{vendor.name}</p>
                          <p className="text-sm text-text-tertiary">${vendor.amount.toLocaleString()}</p>
                        </div>
                        <Badge variant={vendor.w9Status === 'completed' ? 'success' : 'warning'} size="sm">
                          {vendor.w9Status === 'completed' ? 'W-9 Complete' : 'W-9 Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 shadow-soft">
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Client Notes</h3>
                  <p className="text-text-tertiary">Add notes and track important client information</p>
                  <Button className="mt-6">Add Note</Button>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* Edit Client Dialog */}
        <EditClientDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSubmit={handleEditClient}
          client={client}
          loading={isUpdating}
        />
      </div>
    </div>
  );
}