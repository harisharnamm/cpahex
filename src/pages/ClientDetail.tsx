import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useDocuments } from '../hooks/useDocuments';
import { useTransactions } from '../hooks/useTransactions';
import { useClientNotes } from '../hooks/useClientNotes';
import { TopBar } from '../components/organisms/TopBar';
import { GlobalSearch } from '../components/molecules/GlobalSearch';
import { useSearch } from '../contexts/SearchContext';
import { DocumentList } from '../components/ui/document-list';
import { TransactionList } from '../components/ui/transaction-list';
import { TransactionSummary } from '../components/ui/transaction-summary';
import { EnhancedDocumentUpload } from '../components/ui/enhanced-document-upload';
import { DocumentPreview } from '../components/ui/document-preview';
import { AddNoteDialog } from '../components/ui/add-note-dialog';
import { EditNoteDialog } from '../components/ui/edit-note-dialog';
import { EmptyState } from '../components/ui/empty-state';
import { useToast } from '../contexts/ToastContext';
import { Skeleton, SkeletonText } from '../components/ui/skeleton';
import { Button } from '../components/atoms/Button';
import { Badge } from '../atoms/Badge';
import { Input } from '../components/atoms/Input';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  FileText, 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  DollarSign,
  TrendingUp,
  MessageSquare,
  User,
  Tag,
  Clock,
  CheckCircle
} from 'lucide-react';

type TabType = 'overview' | 'documents' | 'transactions' | 'notes';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const { documents, loading: documentsLoading, refreshDocuments, downloadDocument, getDocumentPreviewURL } = useDocuments(id);
  const { transactions, loading: transactionsLoading, summary: transactionSummary } = useTransactions(id);
  const { notes, loading: notesLoading, createNote, updateNote, deleteNote } = useClientNotes(id || '');
  const { isSearchOpen, closeSearch } = useSearch();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showUpload, setShowUpload] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ document: any; url: string } | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null);

  const client = clients.find(c => c.id === id);

  useEffect(() => {
    if (!clientsLoading && !client) {
      navigate('/clients');
    }
  }, [client, clientsLoading, navigate]);

  const handleUploadComplete = (documentIds: string[]) => {
    console.log('Documents uploaded successfully:', documentIds);
    toast.success('Upload Complete', `${documentIds.length} document(s) uploaded successfully`);
    setShowUpload(false);
    refreshDocuments();
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    toast.error('Upload Failed', error);
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      const result = await getDocumentPreviewURL(documentId);
      if (result.url) {
        setPreviewDocument({ document, url: result.url });
      } else {
        toast.error('Preview Failed', result.error || 'Failed to generate preview URL');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Preview Failed', 'An unexpected error occurred');
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

  const handleCreateNote = async (noteData: {
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
  }) => {
    const result = await createNote(noteData);
    if (result.success) {
      toast.success('Note Created', 'Note has been added successfully');
    } else {
      toast.error('Failed to Create Note', result.error || 'An unexpected error occurred');
      throw new Error(result.error);
    }
  };

  const handleUpdateNote = async (noteData: {
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
  }) => {
    if (!editingNote) return;
    
    const result = await updateNote(editingNote.id, noteData);
    if (result.success) {
      toast.success('Note Updated', 'Note has been updated successfully');
      setEditingNote(null);
    } else {
      toast.error('Failed to Update Note', result.error || 'An unexpected error occurred');
      throw new Error(result.error);
    }
  };

  const handleDeleteNote = async (noteId: string, noteTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${noteTitle}"? This action cannot be undone.`)) {
      const result = await deleteNote(noteId);
      if (result.success) {
        toast.success('Note Deleted', 'Note has been deleted successfully');
      } else {
        toast.error('Failed to Delete Note', result.error || 'An unexpected error occurred');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="error" size="sm">High Priority</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium Priority</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low Priority</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
      'tax_planning': 'success',
      'compliance': 'error',
      'communication': 'warning',
      'meeting': 'neutral',
      'document': 'neutral',
      'general': 'neutral'
    };
    
    return (
      <Badge variant={categoryColors[category] || 'neutral'} size="sm">
        {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  if (clientsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
        <TopBar title="Loading..." />
        <div className="max-w-content mx-auto px-8 py-8">
          <Skeleton className="h-32 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
        <TopBar title="Client Not Found" />
        <div className="max-w-content mx-auto px-8 py-8">
          <EmptyState
            icon={User}
            title="Client Not Found"
            description="The client you're looking for doesn't exist or has been deleted."
            action={{
              label: "Back to Clients",
              onClick: () => navigate('/clients'),
              icon: ArrowLeft
            }}
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'transactions', label: 'Transactions', icon: DollarSign, count: transactions.length },
    { id: 'notes', label: 'Notes', icon: MessageSquare, count: notes.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar 
        title={client.name}
        breadcrumbItems={[
          { label: 'Clients', href: '/clients' },
          { label: client.name }
        ]}
        action={{
          label: 'Upload Documents',
          onClick: () => setShowUpload(true),
          icon: Upload
        }}
      />

      {/* Global Search */}
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      
      <div className="max-w-content mx-auto px-8 py-8">
        {/* Client Header */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 mb-8 shadow-soft">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-xl font-bold text-gray-900">
                  {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="neutral" className="capitalize">
                      {client.entity_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="neutral">
                      Tax Year {client.tax_year}
                    </Badge>
                    <Badge variant={client.status === 'active' ? 'success' : 'neutral'}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-secondary">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-text-tertiary" />
                      <span className="text-text-secondary">{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-text-tertiary" />
                      <span className="text-text-secondary">{client.address}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-secondary">Client since {formatDate(client.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                icon={Mail}
                onClick={() => {
                  const subject = encodeURIComponent(`Tax Documents Request - ${new Date().getFullYear()}`);
                  const body = encodeURIComponent(`Dear ${client.name},\n\nI hope this email finds you well. I wanted to reach out regarding your tax documents.\n\nBest regards,\n[Your Name]`);
                  window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_blank');
                }}
              >
                Send Email
              </Button>
              <Button
                variant="secondary"
                icon={Edit}
                onClick={() => {
                  // TODO: Implement edit client functionality
                  toast.info('Edit Client', 'Edit functionality coming soon');
                }}
              >
                Edit Client
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle mb-8 shadow-soft overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-3 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <Badge variant="neutral" size="sm">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Stats */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-tertiary">Documents</p>
                        <p className="text-2xl font-semibold text-text-primary">{documents.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-xl">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-tertiary">Transactions</p>
                        <p className="text-2xl font-semibold text-text-primary">{transactions.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-tertiary">Notes</p>
                        <p className="text-2xl font-semibold text-text-primary">{notes.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Summary */}
                {!transactionsLoading && transactions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Financial Summary</h3>
                    <TransactionSummary summary={transactionSummary} loading={transactionsLoading} />
                  </div>
                )}

                {/* Recent Documents */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">Recent Documents</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('documents')}
                    >
                      View All
                    </Button>
                  </div>
                  
                  {documentsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.slice(0, 5).map((document) => (
                        <div key={document.id} className="bg-surface-elevated rounded-xl border border-border-subtle p-4 hover:shadow-medium transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-text-tertiary" />
                              <div>
                                <h4 className="font-medium text-text-primary">{document.original_filename}</h4>
                                <p className="text-sm text-text-tertiary">
                                  {document.document_type} • {formatDate(document.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={Eye}
                                onClick={() => handlePreviewDocument(document.id)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={Download}
                                onClick={() => handleDownloadDocument(document.id, document.original_filename)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No documents yet"
                      description="Upload documents to get started"
                      action={{
                        label: "Upload Documents",
                        onClick: () => setShowUpload(true),
                        icon: Upload
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Client Info */}
                <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                  <h3 className="font-semibold text-text-primary mb-4">Client Information</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-text-tertiary">Entity Type:</span>
                      <p className="text-text-primary capitalize">{client.entity_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-text-tertiary">Tax Year:</span>
                      <p className="text-text-primary">{client.tax_year}</p>
                    </div>
                    <div>
                      <span className="font-medium text-text-tertiary">Status:</span>
                      <p className="text-text-primary capitalize">{client.status}</p>
                    </div>
                    {client.tax_id && (
                      <div>
                        <span className="font-medium text-text-tertiary">Tax ID:</span>
                        <p className="text-text-primary">{client.tax_id}</p>
                      </div>
                    )}
                    {client.category && (
                      <div>
                        <span className="font-medium text-text-tertiary">Category:</span>
                        <p className="text-text-primary capitalize">{client.category.replace('_', ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Notes */}
                <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary">Recent Notes</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Plus}
                      onClick={() => setShowAddNote(true)}
                    >
                      Add Note
                    </Button>
                  </div>
                  
                  {notesLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : notes.length > 0 ? (
                    <div className="space-y-3">
                      {notes.slice(0, 3).map((note) => (
                        <div key={note.id} className="p-3 bg-surface rounded-lg border border-border-subtle">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-text-primary text-sm">{note.title}</h4>
                            <div className="flex items-center space-x-1">
                              {getPriorityBadge(note.priority)}
                              {getCategoryBadge(note.category)}
                            </div>
                          </div>
                          <p className="text-xs text-text-secondary line-clamp-2">{note.content}</p>
                          <p className="text-xs text-text-tertiary mt-2">{formatDate(note.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary">No notes yet</p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                  <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      className="w-full justify-start bg-primary text-gray-900 hover:bg-primary-hover" 
                      icon={Upload}
                      onClick={() => setShowUpload(true)}
                    >
                      Upload Documents
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start" 
                      icon={Plus}
                      onClick={() => setShowAddNote(true)}
                    >
                      Add Note
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start" 
                      icon={Mail}
                      onClick={() => {
                        const subject = encodeURIComponent(`Tax Documents Request - ${new Date().getFullYear()}`);
                        const body = encodeURIComponent(`Dear ${client.name},\n\nI hope this email finds you well.\n\nBest regards,\n[Your Name]`);
                        window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_blank');
                      }}
                    >
                      Send Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Documents</h2>
                <Button
                  icon={Upload}
                  onClick={() => setShowUpload(true)}
                  className="bg-primary text-gray-900 hover:bg-primary-hover"
                >
                  Upload Documents
                </Button>
              </div>
              
              <DocumentList
                documents={documents}
                loading={documentsLoading}
                onPreview={handlePreviewDocument}
                onDownload={handleDownloadDocument}
              />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Transactions</h2>
                <div className="text-sm text-text-tertiary">
                  Automatically extracted from uploaded financial documents
                </div>
              </div>
              
              {/* Transaction Summary */}
              {!transactionsLoading && transactions.length > 0 && (
                <div className="mb-8">
                  <TransactionSummary summary={transactionSummary} loading={transactionsLoading} />
                </div>
              )}
              
              {/* Transaction List */}
              <TransactionList
                transactions={transactions}
                loading={transactionsLoading}
                onViewDocument={handlePreviewDocument}
              />
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Notes</h2>
                <Button
                  icon={Plus}
                  onClick={() => setShowAddNote(true)}
                  className="bg-primary text-gray-900 hover:bg-primary-hover"
                >
                  Add Note
                </Button>
              </div>
              
              {notesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-text-primary">{note.title}</h3>
                            {getPriorityBadge(note.priority)}
                            {getCategoryBadge(note.category)}
                          </div>
                          <p className="text-text-secondary leading-relaxed">{note.content}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Edit}
                            onClick={() => setEditingNote(note)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Trash2}
                            onClick={() => handleDeleteNote(note.id, note.title)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4 text-text-tertiary">
                          <span>{formatDate(note.created_at)}</span>
                          {note.updated_at !== note.created_at && (
                            <span>Updated {formatDate(note.updated_at)}</span>
                          )}
                        </div>
                        
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Tag className="w-3 h-3 text-text-tertiary" />
                            <div className="flex flex-wrap gap-1">
                              {note.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-md bg-surface text-text-tertiary text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                              {note.tags.length > 3 && (
                                <span className="text-xs text-text-tertiary">
                                  +{note.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="No notes yet"
                  description="Add notes to keep track of important client information"
                  action={{
                    label: "Add First Note",
                    onClick: () => setShowAddNote(true),
                    icon: Plus
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-elevated rounded-2xl shadow-premium max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Upload Documents</h2>
                  <p className="text-text-tertiary">Upload documents for {client.name}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowUpload(false)}
                >
                  Close
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <EnhancedDocumentUpload
                  clientId={client.id}
                  allowMultiple={true}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {previewDocument && (
          <DocumentPreview
            document={previewDocument.document}
            previewUrl={previewDocument.url}
            isOpen={!!previewDocument}
            onClose={() => setPreviewDocument(null)}
            onDownload={() => handleDownloadDocument(previewDocument.document.id, previewDocument.document.original_filename)}
          />
        )}

        {/* Add Note Dialog */}
        <AddNoteDialog
          isOpen={showAddNote}
          onClose={() => setShowAddNote(false)}
          onSubmit={handleCreateNote}
          loading={notesLoading}
        />

        {/* Edit Note Dialog */}
        <EditNoteDialog
          isOpen={!!editingNote}
          onClose={() => setEditingNote(null)}
          onSubmit={handleUpdateNote}
          note={editingNote}
          loading={notesLoading}
        />
      </div>
    </div>
  );
}