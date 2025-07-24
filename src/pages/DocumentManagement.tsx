import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/organisms/TopBar';
import { GlobalSearch } from '../components/molecules/GlobalSearch';
import { useSearch } from '../contexts/SearchContext';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentProcessing, DocumentClassification } from '../hooks/useDocumentProcessing';
import { DocumentClassificationDialog } from '../components/ui/document-classification-dialog';
import { EnhancedDocumentUpload } from '../components/ui/enhanced-document-upload';
import { EmptyState } from '../components/ui/empty-state';
import { useToast } from '../contexts/ToastContext';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Input } from '../components/atoms/Input';
import { 
  Search, 
  Filter, 
  FileText, 
  Upload, 
  Eye, 
  Download, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Document } from '../types/documents';
import type { ProcessingDocument } from '../components/ui/enhanced-document-upload';

export function DocumentManagement() {
  const { documents, loading, refreshDocuments, downloadDocument, getDocumentPreviewURL, deleteDocument } = useDocuments();
  const { getProcessingState, updateProcessingState, approveClassification, overrideClassification } = useDocumentProcessing();
  const { isSearchOpen, closeSearch, openSearch } = useSearch();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showClassificationDialog, setShowClassificationDialog] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState<ProcessingDocument[]>([]);
  const [expandedProcessingDocId, setExpandedProcessingDocId] = useState<string | null>(null);

  // Add a handler to receive processing document info from upload
  const handleProcessingDocument = (processingDoc: ProcessingDocument) => {
    setProcessingDocuments(prev => [...prev, processingDoc]);
  };

  // Remove from processingDocuments when done
  const handleProcessingComplete = (documentId: string) => {
    setProcessingDocuments(prev => prev.filter(doc => doc.documentId !== documentId));
  };

  // Listen for documents that need classification approval
  useEffect(() => {
    documents.forEach(doc => {
      const state = getProcessingState(doc.id);
      
      // Only mark as needing approval if classification is unknown/failed and not already processed
      if (doc.eden_ai_classification && 
          (doc.eden_ai_classification === 'unknown' || doc.eden_ai_classification === 'parsing_failed' || doc.eden_ai_classification === 'extraction_failed') &&
          !state.needsApproval && 
          doc.processing_status !== 'completed' && 
          state.processingStep === 'idle') {
        updateProcessingState(doc.id, {
          classification: doc.eden_ai_classification as DocumentClassification,
          needsApproval: true,
          processingStep: 'classification'
        });
      }
    });
  }, [documents, getProcessingState, updateProcessingState]);

  const handleUploadComplete = (documentIds: string[]) => {
    console.log('Documents uploaded successfully:', documentIds);
    toast.success('Upload Complete', `${documentIds.length} document(s) uploaded and processing started`);
    setShowUpload(false);
    
    // Mark documents as processing
    documentIds.forEach(docId => {
      updateProcessingState(docId, {
        isProcessing: true,
        processingStep: 'ocr'
      });
    });
    
    // Refresh documents to get the latest data
    refreshDocuments();
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    toast.error('Upload Failed', error);
  };

  const handleClassificationApproval = (document: Document) => {
    setSelectedDocument(document);
    setShowClassificationDialog(true);
  };

  const handleApproveClassification = async (classification: DocumentClassification) => {
    if (!selectedDocument) return;
    
    try {
      const result = await approveClassification(selectedDocument.id, classification);
      if (result.success) {
        toast.success('Processing Started', `Document is being processed as ${classification} document`);
        // Refresh documents to get updated data
        setTimeout(() => {
          refreshDocuments();
        }, 1000);
      } else {
        toast.error('Processing Failed', result.error || 'Failed to start document processing');
      }
    } catch (error) {
      console.error('Failed to approve classification:', error);
      toast.error('Processing Failed', 'An unexpected error occurred');
    }
  };

  const handleOverrideClassification = async (newClassification: DocumentClassification) => {
    if (!selectedDocument) return;
    
    try {
      const result = await overrideClassification(selectedDocument.id, newClassification);
      if (result.success) {
        toast.success('Classification Updated', `Document reclassified and processing started as ${newClassification} document`);
        // Refresh documents to get updated data
        setTimeout(() => {
          refreshDocuments();
        }, 1000);
      } else {
        toast.error('Override Failed', result.error || 'Failed to override classification');
      }
    } catch (error) {
      console.error('Failed to override classification:', error);
      toast.error('Override Failed', 'An unexpected error occurred');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const document = documents.find(d => d.id === documentId);
    if (!document) return;
    
    if (window.confirm(`Are you sure you want to delete "${document.original_filename}"? This action cannot be undone.`)) {
      try {
        const result = await deleteDocument(documentId);
        if (result.success) {
          toast.success('Document Deleted', 'Document has been deleted successfully');
          refreshDocuments();
        } else {
          toast.error('Delete Failed', result.error || 'Failed to delete document');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Delete Failed', 'An unexpected error occurred');
      }
    }
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const result = await downloadDocument(documentId, filename);
      if (!result.success) {
        toast.error('Download Failed', result.error || 'Failed to download document');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download Failed', 'An unexpected error occurred');
    }
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      const result = await getDocumentPreviewURL(documentId);
      if (result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Preview Failed', result.error || 'Failed to generate preview URL');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Preview Failed', 'An unexpected error occurred');
    }
  };

  const getStatusBadge = (document: Document) => {
    const state = getProcessingState(document.id);
    
    if (state.needsApproval) {
      return <Badge variant="warning">Needs Approval</Badge>;
    }
    
    if (state.isProcessing) {
      return <Badge variant="neutral">Processing...</Badge>;
    }
    
    if (document.processing_status === 'completed') {
      return <Badge variant="success">Processed</Badge>;
    }
    
    if (document.processing_status === 'classified') {
      return <Badge variant="warning">Classified</Badge>;
    }
    
    if (document.processing_status === 'ocr_complete') {
      return <Badge variant="neutral">OCR Complete</Badge>;
    }
    
    return <Badge variant="neutral">Uploaded</Badge>;
  };

  const getClassificationBadge = (document: Document) => {
    const type = document.secondary_classification || document.eden_ai_classification;
    if (!type) return <Badge variant="error" size="sm">Unknown</Badge>;

    switch (type.toLowerCase()) {
      case 'invoice':
        return <Badge variant="success" size="sm">Invoice</Badge>;
      case 'bank statement':
        return <Badge variant="neutral" size="sm">Bank Statement</Badge>;
      case 'receipt':
        return <Badge variant="warning" size="sm">Receipt</Badge>;
      case 'financial document':
        return <Badge variant="success" size="sm">Financial</Badge>;
      case 'identity document':
        return <Badge variant="neutral" size="sm">Identity</Badge>;
      case 'tax document':
        return <Badge variant="warning" size="sm">Tax</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const getProcessingIcon = (document: Document) => {
    const state = getProcessingState(document.id);
    
    if (state.needsApproval) {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
    
    if (state.isProcessing) {
      return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    }
    
    if (document.eden_ai_processed_data) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    
    return <Clock className="w-4 h-4 text-gray-600" />;
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.ocr_text?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'processed' && doc.processing_status === 'completed') ||
      (statusFilter === 'classified' && doc.processing_status === 'classified') ||
      (statusFilter === 'pending' && (doc.processing_status === 'pending' || !doc.processing_status));
    
    const matchesClassification = classificationFilter === 'all' || 
      doc.eden_ai_classification === classificationFilter;
    
    return matchesSearch && matchesStatus && matchesClassification;
  });

  // Get stats
  const stats = {
    total: documents.length,
    processed: documents.filter(d => d.processing_status === 'completed').length,
    classified: documents.filter(d => d.processing_status === 'classified').length,
    pending: documents.filter(d => d.processing_status === 'pending' || !d.processing_status).length,
    needsApproval: documents.filter(d => {
      const state = getProcessingState(d.id);
      return state.needsApproval;
    }).length
  };

  // Progress bar logic
  const totalDocs = documents.length;
  const completedDocs = documents.filter(doc => doc.processing_status === 'completed').length;
  const inProgressDocs = documents.filter(doc => doc.processing_status !== 'completed' && doc.processing_status !== 'failed').length;
  const progressPercentage = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar 
        title="Document Management" 
        action={{
          label: 'Upload Documents',
          onClick: () => setShowUpload(true),
          icon: Plus
        }}
      />
      
      {/* Global Search */}
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      
      <div className="max-w-content mx-auto px-8 py-8">
        {/* Document Processing Progress Bar */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 mb-8 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Document Processing Progress
            </h2>
            <span className="text-sm font-medium text-text-tertiary">{completedDocs} of {totalDocs} completed</span>
          </div>
          <div className="w-full bg-surface rounded-full h-3 overflow-hidden mb-2">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-tertiary mt-1">
            <span><CheckCircle className="inline w-4 h-4 text-green-600 mr-1" />Completed: {completedDocs}</span>
            <span><Clock className="inline w-4 h-4 text-amber-600 mr-1" />In Progress: {inProgressDocs}</span>
            <span>Total: {totalDocs}</span>
            <span>Progress: {progressPercentage}%</span>
          </div>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Total</p>
                <p className="text-2xl font-semibold text-text-primary">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Processed</p>
                <p className="text-2xl font-semibold text-text-primary">{stats.processed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Classified</p>
                <p className="text-2xl font-semibold text-text-primary">{stats.classified}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Pending</p>
                <p className="text-2xl font-semibold text-text-primary">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Needs Approval</p>
                <p className="text-2xl font-semibold text-text-primary">{stats.needsApproval}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 mb-8 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Upload Documents</h3>
                <p className="text-text-tertiary">Upload documents for AI-powered processing and classification</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowUpload(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <EnhancedDocumentUpload
              allowMultiple={true}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              onProcessingDocument={handleProcessingDocument}
              onProcessingComplete={handleProcessingComplete}
            />
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 mb-8 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="processed">Processed</option>
              <option value="classified">Classified</option>
              <option value="pending">Pending</option>
            </select>
            
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Financial">Financial</option>
              <option value="Identity">Identity</option>
              <option value="Tax">Tax</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
            <div className="divide-y divide-border-subtle">
              {/* Show processing documents at the top */}
              {processingDocuments.map((doc) => (
                <div key={doc.id} className="p-6 bg-surface-hover">
                  <ProcessingStatusIndicator
                    document={doc}
                    onDelete={() => handleProcessingComplete(doc.documentId)}
                  />
                </div>
              ))}
              {/* Then show the rest of the documents */}
              {filteredDocuments.map((document) => {
                const state = getProcessingState(document.id);
                const isExpanded = expandedProcessingDocId === document.id;
                // Find processing doc state if available
                const processingDoc = processingDocuments.find(d => d.documentId === document.id);
                return (
                  <React.Fragment key={document.id}>
                    <div
                      className="p-6 hover:bg-surface-hover transition-all duration-200 cursor-pointer flex items-center justify-between"
                      onClick={() => setExpandedProcessingDocId(isExpanded ? null : document.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-primary" />
                        )}
                        <h3 className="font-semibold text-text-primary">{document.original_filename}</h3>
                        {getStatusBadge(document)}
                        {getClassificationBadge(document)}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getProcessingIcon(document)}
                        {state.needsApproval && (
                          <Button
                            size="sm"
                            onClick={e => { e.stopPropagation(); handleClassificationApproval(document); }}
                            className="bg-primary text-gray-900 hover:bg-primary-hover"
                          >
                            Review Classification
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => { e.stopPropagation(); handlePreviewDocument(document.id); }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Download}
                          onClick={e => { e.stopPropagation(); handleDownloadDocument(document.id, document.original_filename); }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={e => { e.stopPropagation(); handleDeleteDocument(document.id); }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {/* Expanded processing details */}
                    {isExpanded && (
                      <div className="bg-surface p-6 border-t border-border-subtle rounded-b-2xl mt-0 flex flex-col md:flex-row gap-8">
                        {/* Left: Document Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-text-primary mb-2">Document Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div><span className="font-medium text-text-tertiary">Filename:</span> {document.original_filename}</div>
                            <div><span className="font-medium text-text-tertiary">Type:</span> {document.document_type}</div>
                            <div><span className="font-medium text-text-tertiary">Size:</span> {(document.file_size / 1024 / 1024).toFixed(2)} MB</div>
                            <div><span className="font-medium text-text-tertiary">Status:</span> {document.processing_status}</div>
                            <div><span className="font-medium text-text-tertiary">Classification:</span> {document.eden_ai_classification || '—'}</div>
                            <div><span className="font-medium text-text-tertiary">Secondary Classification:</span> {document.secondary_classification || '—'}</div>
                            <div><span className="font-medium text-text-tertiary">Client:</span> {document.client_id || '—'}</div>
                            <div><span className="font-medium text-text-tertiary">Created:</span> {new Date(document.created_at).toLocaleString()}</div>
                            <div><span className="font-medium text-text-tertiary">Updated:</span> {new Date(document.updated_at).toLocaleString()}</div>
                          </div>
                          {document.ocr_text && (
                            <div className="mt-4 text-xs text-text-tertiary bg-surface-elevated rounded p-2">
                              <span className="font-medium">OCR Preview:</span> {document.ocr_text.substring(0, 200)}{document.ocr_text.length > 200 ? '...' : ''}
                            </div>
                          )}
                        </div>
                        {/* Right: Processing Progress (if available) */}
                        {processingDoc && (
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-text-primary mb-2">Processing Progress</h4>
                            <ProcessingStatusIndicator document={processingDoc} />
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Classification Dialog */}
      <DocumentClassificationDialog
        isOpen={showClassificationDialog}
        onClose={() => {
          setShowClassificationDialog(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        classification={(selectedDocument?.eden_ai_classification as DocumentClassification) || 'Unknown'}
        onApprove={handleApproveClassification}
        onOverride={handleOverrideClassification}
        loading={selectedDocument ? getProcessingState(selectedDocument.id).isProcessing : false}
      />
    </div>
  );
}