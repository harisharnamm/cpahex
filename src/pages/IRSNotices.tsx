import { useState } from 'react';
import { useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { TopBar } from '../components/organisms/TopBar';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Copy, Download, FileText, AlertTriangle, Clock, CheckCircle, ArrowLeft, Eye, Trash2, Plus } from 'lucide-react';
import { EnhancedFileUpload } from '../components/ui/enhanced-file-upload';
import { EnhancedDocumentPreview } from '../components/ui/enhanced-document-preview';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useIRSNotices } from '../hooks/useIRSNotices';
import { useDocuments } from '../hooks/useDocuments';
import { noticeProcessingService } from '../lib/noticeProcessingService';
import { EnrichedIRSNotice } from '../types/documents';

export function IRSNotices() {
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    noticeId: string | null;
    noticeName: string;
  }>({
    isOpen: false,
    noticeId: null,
    noticeName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-focus upload section when navigated from dashboard
  useEffect(() => {
    // Check if we came from dashboard quick action
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'upload') {
      // Scroll to upload section
      setTimeout(() => {
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
          uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, []);

  // Use our hooks to get real data
  const { notices, loading: noticesLoading, createNotice, refreshNotices, deleteNotice } = useIRSNotices();
  const { getDocumentPreviewURL, downloadDocument } = useDocuments();
  const { createTask } = useTasks();

  // Cast notices to enriched type since we know the query includes joins
  const enrichedNotices = notices as EnrichedIRSNotice[];

  // Find the selected notice
  const selectedNotice = enrichedNotices.find(notice => notice.id === selectedNoticeId);

  const handleNoticeSelect = async (noticeId: string) => {
    setSelectedNoticeId(noticeId);
    
    // If there's a document, start processing it
    const notice = enrichedNotices.find(n => n.id === noticeId);
    console.log('🔍 Selected notice:', notice);
    console.log('🔍 Document ID:', notice?.document_id);
    console.log('🔍 Has AI summary:', !!notice?.ai_summary);
    
    if (notice?.document_id && !notice.ai_summary) {
      console.log('🤖 Starting AI processing for notice:', noticeId);
      setIsProcessing(true);
      try {
        const result = await noticeProcessingService.processIRSNotice(
          notice.document_id, 
          notice.user_id, 
          notice.client_id
        );
        console.log('🤖 AI processing result:', result);
        // Refresh notices to get updated AI summary
        refreshNotices();
      } catch (error) {
        console.error('Failed to process notice:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      console.log('🔍 Skipping AI processing:', {
        hasDocumentId: !!notice?.document_id,
        hasAiSummary: !!notice?.ai_summary
      });
    }
  };

  const handleUploadComplete = async (documentIds: string[]) => {
    console.log('IRS Notice uploaded successfully:', documentIds);
    
    // Create IRS notice records for each uploaded document
    for (const documentId of documentIds) {
      try {
        const result = await createNotice({
          document_id: documentId,
          notice_type: 'General',
          priority: 'medium'
        });
        
        // If creation fails due to duplicate, that's okay - the notice already exists
        if (!result.success && result.error?.includes('already exists')) {
          console.log(`IRS notice already exists for document ${documentId}, skipping creation`);
        } else if (!result.success) {
          console.error('Failed to create notice record:', result.error);
        }
      } catch (error) {
        console.error('Failed to create notice record:', error);
      }
    }
    
    // Refresh the notices list
    refreshNotices();
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    // TODO: Show error message to user
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      console.log('⬇️ Downloading document:', documentId);
      const result = await downloadDocument(documentId, filename);
      if (!result.success) {
        console.error('❌ Download failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Download error:', error);
    }
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      console.log('🖼️ Preview requested for document:', documentId);
      const result = await getDocumentPreviewURL(documentId);
      console.log('📋 Preview URL result:', result);
      if (result.url) {
        console.log('✅ Setting preview URL and opening modal');
        setPreviewUrl(result.url);
        setShowPreview(true);
      } else {
        console.error('❌ No preview URL returned:', result.error);
      }
    } catch (error) {
      console.error('❌ Failed to get preview URL:', error);
    }
  };

  const handleBackToList = () => {
    setSelectedNoticeId(null);
    setShowPreview(false);
    setPreviewUrl(null);
  };

  const handleDeleteClick = (notice: EnrichedIRSNotice) => {
    const displayName = getNoticeDisplayName(notice);
    setDeleteConfirm({
      isOpen: true,
      noticeId: notice.id,
      noticeName: displayName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.noticeId) return;

    setIsDeleting(true);
    try {
      const result = await deleteNotice(deleteConfirm.noticeId);
      if (result.success) {
        // Close confirmation dialog
        setDeleteConfirm({ isOpen: false, noticeId: null, noticeName: '' });
        // If we were viewing the deleted notice, go back to list
        if (selectedNoticeId === deleteConfirm.noticeId) {
          setSelectedNoticeId(null);
        }
      } else {
        console.error('Failed to delete notice:', result.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Delete error:', error);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, noticeId: null, noticeName: '' });
  };

  const handleCreateTask = async () => {
    console.log('🔄 Creating task for notice:', selectedNotice?.id);
    if (!selectedNotice) return;

    const taskTitle = `Review IRS Notice: ${getNoticeDisplayName(selectedNotice)}`;
    const taskDescription = `Review and respond to IRS notice with the following details:

Notice Type: ${selectedNotice.notice_type}
${selectedNotice.amount_owed ? `Amount Owed: $${selectedNotice.amount_owed.toLocaleString()}` : ''}
${selectedNotice.deadline_date ? `Deadline: ${new Date(selectedNotice.deadline_date).toLocaleDateString()}` : ''}

AI Recommendations:
${selectedNotice.ai_recommendations || 'Review the AI analysis for detailed recommendations.'}`;

    const priority = selectedNotice.priority === 'critical' || selectedNotice.priority === 'high' ? 'high' : 
                    selectedNotice.priority === 'medium' ? 'medium' : 'low';

    console.log('🔄 Task data:', {
      title: taskTitle,
      priority,
      due_date: selectedNotice.deadline_date,
      client_id: selectedNotice.client_id
    });
    
    // Show loading state
    const originalButtonText = 'Create Task';
    
    const result = await createTask({
      title: taskTitle,
      description: taskDescription,
      task_type: 'deadline',
      priority: priority as 'low' | 'medium' | 'high',
      due_date: selectedNotice.deadline_date,
      client_id: selectedNotice.client_id
    });

    if (result.success) {
      console.log('✅ Task created successfully');
      alert('✅ Task created successfully! Check your dashboard to see the new task.');
    } else {
      console.error('❌ Failed to create task:', result.error);
      alert(`Failed to create task: ${result.error}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'appealed':
        return <Badge variant="neutral">Appealed</Badge>;
      default:
        return <Badge variant="error">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="error" size="sm">Critical</Badge>;
      case 'high':
        return <Badge variant="error" size="sm">High Priority</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium Priority</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low Priority</Badge>;
    }
  };

  const formatDeadline = (deadlineDate?: string) => {
    if (!deadlineDate) return null;
    const date = new Date(deadlineDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      date: date.toLocaleDateString(),
      isOverdue: diffDays < 0,
      daysRemaining: diffDays
    };
  };

  const getNoticeDisplayName = (notice: EnrichedIRSNotice) => {
    if (notice.notice_number) {
      return `${notice.notice_type} - ${notice.notice_number}`;
    }
    if (notice.documents?.original_filename) {
      return notice.documents.original_filename;
    }
    return `${notice.notice_type} Notice`;
  };

  if (noticesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
        <TopBar title="IRS Notices" />
        <div className="max-w-content mx-auto px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading IRS notices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar title="IRS Notices" />
      
      <div className="max-w-content mx-auto px-8 py-8">
        {!selectedNoticeId ? (
          <div>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-tertiary">Total Notices</p>
                    <p className="text-2xl font-semibold text-text-primary">{enrichedNotices.length}</p>
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
                      {enrichedNotices.filter(n => n.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-tertiary">Resolved</p>
                    <p className="text-2xl font-semibold text-text-primary">
                      {enrichedNotices.filter(n => n.status === 'resolved').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-tertiary">High Priority</p>
                    <p className="text-2xl font-semibold text-text-primary">
                      {enrichedNotices.filter(n => n.priority === 'high' || n.priority === 'critical').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <div id="upload-section" className="bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden mb-8 shadow-soft">
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">Upload IRS Notice</h3>
                  <p className="text-text-tertiary">Upload your IRS notice for AI-powered analysis and summary</p>
                </div>
                <EnhancedFileUpload 
                  documentType="irs_notice"
                  allowMultiple={false}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </div>
            </div>

            {/* Recent Notices */}
            {enrichedNotices.length > 0 ? (
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
                <div className="p-6 border-b border-border-subtle">
                  <h2 className="text-xl font-semibold text-text-primary">Recent Notices</h2>
                </div>
                <div className="divide-y divide-border-subtle">
                  {enrichedNotices.map((notice) => {
                    const deadline = formatDeadline(notice.deadline_date);
                    const displayName = getNoticeDisplayName(notice);
                    
                    return (
                      <div 
                        key={notice.id}
                        className="p-6 hover:bg-surface-hover cursor-pointer transition-all duration-200 group"
                        onClick={() => handleNoticeSelect(notice.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-text-primary group-hover:text-blue-600 transition-colors duration-200">
                                {displayName}
                              </h3>
                              {getStatusBadge(notice.status)}
                              {getPriorityBadge(notice.priority)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-text-tertiary">
                              {notice.clients?.name && (
                                <span>Client: {notice.clients.name}</span>
                              )}
                              <span>Created: {new Date(notice.created_at).toLocaleDateString()}</span>
                              {notice.tax_year && (
                                <span>Tax Year: {notice.tax_year}</span>
                              )}
                              {deadline && (
                                <span className={deadline.isOverdue ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                                  {deadline.isOverdue ? "Overdue" : `Deadline: ${deadline.date}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {notice.documents && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                icon={Eye}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewDocument(notice.document_id!);
                                }}
                              >
                                Preview
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={Trash2}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(notice);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-12 text-center shadow-soft">
                <AlertTriangle className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No IRS Notices Yet</h3>
                <p className="text-text-tertiary mb-4">Upload your first IRS notice to get started with AI-powered analysis</p>
              </div>
            )}
          </div>
        ) : selectedNotice ? (
          <div>
            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="ghost"
                icon={ArrowLeft}
                onClick={handleBackToList}
              >
                Back to Notices
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Document Preview */}
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
                <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Document Preview</h3>
                  {selectedNotice.documents && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Eye}
                      onClick={() => handlePreviewDocument(selectedNotice.document_id!)}
                    >
                      Full Preview
                    </Button>
                  )}
                </div>
                <div className="aspect-[4/3] bg-surface">
                  {selectedNotice.documents ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                        <span className="text-text-secondary">
                          {selectedNotice.documents.original_filename}
                        </span>
                        <p className="text-xs text-text-tertiary mt-2">
                          Click "Full Preview" to view document
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                        <span className="text-text-secondary">No document attached</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
                <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">AI Analysis</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-xs text-text-tertiary bg-surface px-2 py-1 rounded-lg font-medium">
                      Powered by AI
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-surface rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-surface rounded w-1/2 mb-3"></div>
                        <div className="h-4 bg-surface rounded w-5/6 mb-3"></div>
                        <div className="h-4 bg-surface rounded w-2/3"></div>
                      </div>
                      <p className="text-text-secondary text-center">Processing notice with AI...</p>
                    </div>
                  ) : selectedNotice.ai_summary ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-text-primary leading-relaxed">
                        {selectedNotice.ai_summary}
                      </div>
                      {selectedNotice.ai_recommendations && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
                          <div className="whitespace-pre-wrap text-blue-800">
                            {selectedNotice.ai_recommendations}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                      <p className="text-text-secondary">
                        {selectedNotice.document_id 
                          ? "Click to start AI analysis of this notice"
                          : "No document attached for analysis"
                        }
                      </p>
                      {selectedNotice.document_id && (
                        <Button
                          className="mt-4"
                          onClick={() => handleNoticeSelect(selectedNotice.id)}
                          disabled={isProcessing}
                        >
                          Start AI Analysis
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {selectedNotice.ai_summary && (
                  <div className="p-6 border-t border-border-subtle bg-surface">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        icon={Copy} 
                        className="flex-1 sm:flex-none"
                        onClick={() => navigator.clipboard.writeText(selectedNotice.ai_summary || '')}
                      >
                        Copy Summary
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        icon={Download} 
                        className="flex-1 sm:flex-none"
                      >
                        Download Report
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        icon={Plus}
                        onClick={handleCreateTask}
                        className="flex-1 sm:flex-none bg-primary text-gray-900 hover:bg-primary-hover"
                      >
                        Create Task
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Preview Modal */}
        {showPreview && previewUrl && selectedNotice?.documents && (
          <EnhancedDocumentPreview
            document={selectedNotice.documents}
            previewUrl={previewUrl}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            onDownload={() => handleDownloadDocument(selectedNotice.document_id!, selectedNotice.documents!.original_filename)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete IRS Notice"
          message={`Are you sure you want to delete "${deleteConfirm.noticeName}"? This action will permanently remove the notice and its associated document. This cannot be undone.`}
          confirmText="Delete"
          confirmVariant="secondary"
          loading={isDeleting}
        />
      </div>
    </div>
  );
}