import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { useClients } from '../hooks/useClients';
import { GlobalSearch } from '../components/molecules/GlobalSearch';
import { useSearch } from '../contexts/SearchContext';
import { AddTransactionDialog } from '../components/ui/add-transaction-dialog';
import { EditClientDialog } from '../components/ui/edit-client-dialog';
import { AddNoteDialog } from '../components/ui/add-note-dialog';
import { EditNoteDialog } from '../components/ui/edit-note-dialog';
import { useClientNotes, ClientNote } from '../hooks/useClientNotes';
import { useToast } from '../contexts/ToastContext';
import { TopBar } from '../components/organisms/TopBar';
import { Search, Filter, FileText, Calendar, User, Upload, Download, Eye, Edit, DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, Banknote, Plus, Trash2, Tag, Clock, AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { EnhancedFileUpload } from '../components/ui/enhanced-file-upload';
import { EnhancedDocumentUpload } from '../components/ui/enhanced-document-upload';
import { useDocuments } from '../hooks/useDocuments';
import { DOCUMENT_TYPE_LABELS } from '../types/documents';

export function ClientDetail() {
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState(0);
  const { clients, loading: clientsLoading, updateClient } = useClients();
  const { isSearchOpen, closeSearch, openSearch } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClientNote | null>(null);
  const [selectedFinancialDocs, setSelectedFinancialDocs] = useState<string[]>([]);
  const [isProcessingFinancialDocs, setIsProcessingFinancialDocs] = useState(false);
  const [isProcessingDocuments, setIsProcessingDocuments] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const toast = useToast();
  
  // Reconciliation functions
  const approveReconciliation = (queueItemId: string) => {
    const queueItem = reconciliationQueue.find(item => item.id === queueItemId);
    if (!queueItem) return;
    
    const { newTransaction, match } = queueItem;
    
    // Update both transactions to reconciled status
    const reconciledNewTransaction = {
      ...newTransaction,
      status: 'reconciled',
      reconciled_with: match.id,
      updated_at: new Date().toISOString()
    };
    
    // Add new transaction to main list
    setTransactions(prev => [
      ...prev.map(t => 
        t.id === match.id 
          ? { ...t, status: 'reconciled', reconciled_with: newTransaction.id, updated_at: new Date().toISOString() }
          : t
      ),
      reconciledNewTransaction
    ]);
    
    // Remove from pending transactions if it exists
    setPendingTransactions(prev => prev.filter(t => t.id !== newTransaction.id));
    
    // Remove from reconciliation queue
    setReconciliationQueue(prev => prev.filter(item => item.id !== queueItemId));
    
    // Show success message
    toast.success('Transactions Reconciled', 'Transactions successfully reconciled!');
  };

  const rejectReconciliation = (queueItemId: string) => {
    const queueItem = reconciliationQueue.find(item => item.id === queueItemId);
    if (!queueItem) return;
    
    const { newTransaction } = queueItem;
    
    // Add new transaction as separate entry
    setTransactions(prev => [...prev, {
      ...newTransaction,
      status: newTransaction.status === 'pending' ? 'needs_review' : newTransaction.status,
      updated_at: new Date().toISOString()
    }]);
    
    // Remove from pending transactions
    setPendingTransactions(prev => prev.filter(t => t.id !== newTransaction.id));
    
    // Remove from reconciliation queue
    setReconciliationQueue(prev => prev.filter(item => item.id !== queueItemId));
    
    toast.info('Transactions Separated', 'Transactions kept separate');
  };

  const approveAllReconciliations = () => {
    const highConfidenceItems = reconciliationQueue.filter(item => item.confidence >= 0.85);
    
    if (highConfidenceItems.length === 0) {
      toast.warning('No High-Confidence Matches', 'No high-confidence matches to approve');
      return;
    }
    
    highConfidenceItems.forEach(item => {
      approveReconciliation(item.id);
    });
    
    toast.success('Bulk Approval Complete', `Approved ${highConfidenceItems.length} high-confidence matches`);
  };

  const rejectAllReconciliations = () => {
    const currentQueue = [...reconciliationQueue];
    
    currentQueue.forEach(item => {
      rejectReconciliation(item.id);
    });
    
    toast.info('Bulk Rejection Complete', `Rejected ${currentQueue.length} pending reconciliations`);
  };
  
  // Use our document hooks
  const { documents, loading, downloadDocument, deleteDocument, getDocumentPreviewURL, refreshDocuments } = useDocuments(id);
  
  // Filter documents to get only financial documents
  const financialDocuments = documents.filter(doc => 
    doc.eden_ai_classification === 'Financial' || 
    doc.eden_ai_classification === 'financial' ||
    doc.document_type === 'receipt' ||
    doc.document_type === 'invoice' ||
    doc.document_type === 'bank_statement'
  );
  
  const { notes, loading: notesLoading, createNote, updateNote, deleteNote } = useClientNotes(id || '');
  
  const tabs = ['Documents', 'Bookkeeping', 'Notes'];
  
  // Sample transactions for the bookkeeping ledger
  const [transactions, setTransactions] = useState([
    {
      id: '1',
      date: '2025-06-15',
      type: 'income',
      category: 'Sales',
      description: 'Client payment - ABC Corp',
      amount: 2500.00,
      document: 'invoice-abc-corp.pdf'
    },
    {
      id: '2',
      date: '2025-06-10',
      type: 'expense',
      category: 'Office Supplies',
      description: 'Office Depot - Printer paper and toner',
      amount: 125.75,
      document: 'receipt-office-depot.pdf'
    },
    {
      id: '3',
      date: '2025-06-05',
      type: 'expense',
      category: 'Utilities',
      description: 'Electric bill - June',
      amount: 210.50,
      document: 'electric-bill-june.pdf'
    },
    {
      id: '4',
      date: '2025-06-01',
      type: 'income',
      category: 'Consulting',
      description: 'Consulting services - XYZ Inc',
      amount: 1800.00,
      document: 'invoice-xyz-inc.pdf'
    },
    {
      id: '5',
      date: '2025-05-28',
      type: 'expense',
      category: 'Software',
      description: 'Accounting software subscription',
      amount: 49.99,
      document: 'software-receipt.pdf'
    }
  ]);
  
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

  const handleUploadComplete = (documentIds: string[]) => {
    console.log('Documents uploaded successfully:', documentIds);
    setShowUpload(false);
    // Documents will automatically refresh via the hook
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    toast.error('Upload Failed', error);
  };

  const handleFinancialDocumentUpload = (documentIds: string[]) => {
    // This function is no longer used since we removed the upload component
    console.log('Financial documents uploaded successfully:', documentIds);
    toast.success('Documents Uploaded', `${documentIds.length} financial document(s) uploaded and processed`);
  };
  
  const handleFinancialDocToggle = (documentId: string) => {
    setSelectedFinancialDocs(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };
  
  const handleProcessFinancialDocuments = async () => {
    if (selectedFinancialDocs.length === 0) return;
    
    setIsProcessingFinancialDocs(true);
    try {
      // Process selected financial documents and extract transaction data
      const selectedDocs = financialDocuments.filter(doc => selectedFinancialDocs.includes(doc.id));
      const newTransactions: any[] = [];
      const newPendingTransactions: any[] = [];
      
      // Generate transactions from the selected documents
      selectedDocs.map((document, index) => {
        // Process financial document data using new structure
        try {
          // Extract financial data from document's processing response
          const financialData = document.financial_processing_response;
          
          if (financialData && financialData.results) {
            // Process the financial data into transaction objects
            const transaction = processExtractedFinancialData(
              financialData.results,
              document.document_type,
              document.id
            );
            
            // Validate transaction before adding
            if (validateTransaction(transaction)) {
              if (transaction.confidence_level >= 80) {
                newTransactions.push(transaction);
              } else {
                newPendingTransactions.push(transaction);
              }
            } else {
              console.warn('Invalid transaction generated for document:', document.id);
            }
          } else {
            // Fallback: create basic transaction if no financial processing data
            const fallbackTransaction = createTransaction({
              date: new Date().toISOString().split('T')[0],
              type: 'expense',
              category: 'Business Expense',
              description: `Transaction from ${document.original_filename}`,
              amount: 0, // Will need manual entry
              source_document_type: document.document_type,
              source_document_id: document.id,
              confidence_level: 30,
              status: 'pending',
              merchant_name: 'Unknown'
            });
            
            newPendingTransactions.push(fallbackTransaction);
          }
        } catch (error) {
          console.error('Error processing document:', document.id, error);
          
          // Create error transaction for manual review
          const errorTransaction = createTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            category: 'Needs Review',
            description: `Error processing ${document.original_filename}`,
            amount: 0,
            source_document_type: document.document_type,
            source_document_id: document.id,
            confidence_level: 0,
            status: 'error',
            merchant_name: 'Error'
          });
          
          newPendingTransactions.push(errorTransaction);
        }
      });
      
      // Add new transactions to the beginning of the list
      setTransactions(prev => [...newTransactions, ...prev]);
      setSelectedFinancialDocs([]);
      
      // Update state with new transactions
      setTransactions(prev => [...prev, ...newTransactions]);
      setPendingTransactions(prev => [...prev, ...newPendingTransactions]);
      
      // Add high-confidence transactions to reconciliation queue
      const highConfidenceTransactions = newTransactions.filter(t => t.confidence_level >= 90);
      setReconciliationQueue(prev => [...prev, ...highConfidenceTransactions]);

      toast.success(
        'Documents Processed', 
        `Generated ${newTransactions.length} confirmed and ${newPendingTransactions.length} pending transaction(s)`
      );
      
    } catch (error) {
      console.error('Failed to process financial documents:', error);
      toast.error('Processing Failed', 'Failed to process financial documents for bookkeeping');
    } finally {
      setIsProcessingFinancialDocs(false);
    }
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

  const handleAddTransaction = async (transactionData: {
    date: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    document?: string;
  }) => {
    setIsAddingTransaction(true);
    try {
      // Generate a unique ID for the new transaction
      const newId = Math.random().toString(36).substring(2, 9);
      
      // Add the new transaction to the state
      const newTransaction = {
        id: newId,
        date: transactionData.date,
        type: transactionData.type,
        category: transactionData.category,
        description: transactionData.description,
        amount: transactionData.amount,
        document: transactionData.document || 'No document'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      return Promise.reject(error);
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const handleAddNote = async (noteData: {
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
  }) => {
    try {
      const result = await createNote(noteData);
      if (result.success) {
        toast.success('Note Added', 'Client note has been created successfully');
      } else {
        toast.error('Failed to Add Note', result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to Add Note', 'An unexpected error occurred');
      throw error;
    }
  };

  const handleEditNote = async (noteData: {
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
  }) => {
    if (!selectedNote) return;
    
    try {
      const result = await updateNote(selectedNote.id, noteData);
      if (result.success) {
        toast.success('Note Updated', 'Client note has been updated successfully');
        setShowEditNoteDialog(false);
        setSelectedNote(null);
      } else {
        toast.error('Failed to Update Note', result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('Failed to Update Note', 'An unexpected error occurred');
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string, noteTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${noteTitle}"? This action cannot be undone.`)) {
      try {
        const result = await deleteNote(noteId);
        if (result.success) {
          toast.success('Note Deleted', 'Client note has been deleted successfully');
        } else {
          toast.error('Failed to Delete Note', result.error || 'An error occurred');
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
        toast.error('Failed to Delete Note', 'An unexpected error occurred');
      }
    }
  };

  const handleExportReport = () => {
    // TODO: Implement export functionality
    console.log('Export report functionality to be implemented');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'tax_planning':
        return <FileText className="w-4 h-4" />;
      case 'compliance':
        return <AlertTriangle className="w-4 h-4" />;
      case 'communication':
        return <MessageSquare className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'tax_planning':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'compliance':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'communication':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'document':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
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
      
      {/* Global Search */}
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      
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
              {/* Search and Filters */}
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="secondary" 
                    icon={Search} 
                    onClick={openSearch}
                    className="flex-1"
                  >
                    Search documents...
                  </Button>
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
              <div className="space-y-8">
                {/* Bookkeeping Overview */}
                <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">Financial Overview</h3>
                      <p className="text-text-tertiary">Track income, expenses, and financial documents</p>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="secondary" icon={FileText} onClick={handleExportReport}>
                        Export
                      </Button>
                      <Button 
                        variant="primary" 
                        icon={Plus} 
                        className="bg-primary text-gray-900 hover:bg-primary-hover"
                        onClick={() => setShowAddTransactionDialog(true)}
                      >
                        Add Transaction
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-surface rounded-xl border border-border-subtle p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-tertiary">Total Income</p>
                          <p className="text-xl font-semibold text-emerald-600">$4,300.00</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl border border-border-subtle p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-tertiary">Total Expenses</p>
                          <p className="text-xl font-semibold text-red-600">$386.24</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl border border-border-subtle p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-tertiary">Net Balance</p>
                          <p className="text-xl font-semibold text-blue-600">$3,913.76</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Document Upload Section */}
                  {/* Financial Document Selector */}
                  <div className="bg-surface rounded-xl border border-border-subtle p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-text-primary">Process Financial Documents</h4>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={() => refreshDocuments()}
                        className="text-text-secondary hover:text-text-primary"
                      >
                        Refresh
                      </Button>
                    </div>
                    
                    {/* Financial Documents List */}
                    {loading ? (
                      <div className="text-center py-4">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-text-tertiary">Loading financial documents...</p>
                      </div>
                    ) : (
                      <>
                        {financialDocuments.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-sm text-text-tertiary mb-3">
                              Select financial documents to process for bookkeeping ({financialDocuments.length} available)
                            </p>
                            
                            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                              {financialDocuments.map(doc => (
                                <div 
                                  key={doc.id} 
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                                    selectedFinancialDocs.includes(doc.id)
                                      ? 'bg-primary/10 border-primary/30 shadow-soft'
                                      : 'bg-surface-elevated border-border-subtle hover:border-border-light hover:shadow-soft'
                                  }`}
                                  onClick={() => handleFinancialDocToggle(doc.id)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedFinancialDocs.includes(doc.id)}
                                      onChange={() => handleFinancialDocToggle(doc.id)}
                                      className="w-4 h-4 text-primary bg-surface border-border-subtle rounded focus:ring-primary focus:ring-2"
                                    />
                                    <FileText className="w-5 h-5 text-text-tertiary" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-text-primary truncate">{doc.original_filename}</p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Badge variant="success" size="sm">Financial</Badge>
                                        <span className="text-xs text-text-tertiary">
                                          {new Date(doc.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-text-tertiary">
                                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      icon={Eye}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreview(doc.id);
                                      }}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      title="Preview document"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      icon={Download}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(doc.id, doc.original_filename);
                                      }}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      title="Download document"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {selectedFinancialDocs.length > 0 && (
                              <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-text-primary">
                                      {selectedFinancialDocs.length} document(s) selected
                                    </h5>
                                    <p className="text-sm text-text-secondary">
                                      Process these documents to extract financial data for bookkeeping
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setSelectedFinancialDocs([])}
                                      className="text-text-secondary hover:text-text-primary"
                                    >
                                      Clear Selection
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      icon={DollarSign}
                                      onClick={handleProcessFinancialDocuments}
                                      disabled={isProcessingFinancialDocs}
                                      className="bg-primary text-gray-900 hover:bg-primary-hover"
                                    >
                                      {isProcessingFinancialDocs ? 'Processing...' : 'Process for Bookkeeping'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                            <h5 className="font-semibold text-text-primary mb-2">No Financial Documents Found</h5>
                            <p className="text-text-tertiary text-sm mb-4">
                              Upload documents in the Documents tab and they will appear here once classified as financial documents
                            </p>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedTab(0)}
                              className="text-primary hover:text-primary-hover"
                            >
                              Go to Documents Tab
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Transaction Ledger */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-text-primary">Transaction Ledger</h4>
                      <div className="flex items-center space-x-2">
                        <select className="px-3 py-1 text-sm border border-border-subtle rounded-lg bg-surface-elevated">
                          <option value="all">All Transactions</option>
                          <option value="income">Income Only</option>
                          <option value="expense">Expenses Only</option>
                        </select>
                        <Button variant="ghost" size="sm" icon={Filter}>
                          Filter
                        </Button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-surface border-b border-border-subtle">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Document
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-surface-hover transition-all duration-200">
                              <td className="px-4 py-3 text-sm text-text-secondary">
                                {new Date(transaction.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                {transaction.type === 'income' ? (
                                  <Badge variant="success" size="sm">Income</Badge>
                                ) : (
                                  <Badge variant="error" size="sm">Expense</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-text-secondary">
                                {transaction.category}
                              </td>
                              <td className="px-4 py-3 text-sm text-text-primary font-medium">
                                {transaction.description}
                              </td>
                              <td className={`px-4 py-3 text-sm font-semibold text-right ${
                                transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={FileText}
                                  className="text-xs py-1 px-2 h-7"
                                >
                                  View
                                </Button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Edit}
                                    className="text-xs py-1 px-2 h-7"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Eye}
                                    className="text-xs py-1 px-2 h-7"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                      <div className="text-sm text-text-tertiary">
                        Showing 5 of 24 transactions
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" disabled>
                          Previous
                        </Button>
                        <Button variant="ghost" size="sm">
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Categories Summary */}
                <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                  <h3 className="text-lg font-semibold text-text-primary mb-6">Categories Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income Categories */}
                    <div>
                      <h4 className="font-medium text-text-primary mb-4">Income Categories</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <Banknote className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-text-primary">Sales</span>
                          </div>
                          <div className="text-emerald-600 font-semibold">$2,500.00</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <Banknote className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-text-primary">Consulting</span>
                          </div>
                          <div className="text-emerald-600 font-semibold">$1,800.00</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expense Categories */}
                    <div>
                      <h4 className="font-medium text-text-primary mb-4">Expense Categories</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <CreditCard className="w-4 h-4 text-red-600" />
                            </div>
                            <span className="text-text-primary">Office Supplies</span>
                          </div>
                          <div className="text-red-600 font-semibold">$125.75</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <CreditCard className="w-4 h-4 text-red-600" />
                            </div>
                            <span className="text-text-primary">Utilities</span>
                          </div>
                          <div className="text-red-600 font-semibold">$210.50</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <CreditCard className="w-4 h-4 text-red-600" />
                            </div>
                            <span className="text-text-primary">Software</span>
                          </div>
                          <div className="text-red-600 font-semibold">$49.99</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="space-y-6">
                {/* Notes Header */}
                <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">Client Notes</h3>
                      <p className="text-text-tertiary">Track important client information and communications</p>
                    </div>
                    <Button 
                      variant="primary" 
                      icon={Plus} 
                      className="bg-primary text-gray-900 hover:bg-primary-hover"
                      onClick={() => setShowAddNoteDialog(true)}
                    >
                      Add Note
                    </Button>
                  </div>
                  
                  {/* Notes Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-surface rounded-xl border border-border-subtle p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-tertiary">Total Notes</p>
                          <p className="text-xl font-semibold text-text-primary">{notes.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl border border-border-subtle p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-tertiary">High Priority</p>
                          <p className="text-xl font-semibold text-text-primary">
                            {notes.filter(n => n.priority === 'high').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl border border-border-subtle p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-tertiary">Tax Planning</p>
                          <p className="text-xl font-semibold text-text-primary">
                            {notes.filter(n => n.category === 'tax_planning').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl border border-border-subtle p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Calendar className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-tertiary">Recent</p>
                          <p className="text-xl font-semibold text-text-primary">
                            {notes.filter(n => 
                              new Date().getTime() - new Date(n.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
                            ).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes List */}
                <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
                  {notesLoading ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-text-secondary">Loading notes...</p>
                    </div>
                  ) : notes.length > 0 ? (
                    <div className="divide-y divide-border-subtle">
                      {notes.map((note) => (
                        <div key={note.id} className="p-6 hover:bg-surface-hover transition-all duration-200 group">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-text-primary text-lg">{note.title}</h4>
                                <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(note.category)}`}>
                                  {getCategoryIcon(note.category)}
                                  <span className="ml-1 capitalize">{note.category.replace('_', ' ')}</span>
                                </div>
                                {getPriorityBadge(note.priority)}
                              </div>
                              <p className="text-text-secondary leading-relaxed mb-3">{note.content}</p>
                              
                              {/* Tags */}
                              {note.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {note.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-md bg-surface text-text-tertiary text-xs font-medium border border-border-subtle"
                                    >
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-text-tertiary">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Created: {formatDate(note.created_at)}</span>
                                </div>
                                {note.updated_at !== note.created_at && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Updated: {formatDate(note.updated_at)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={Edit}
                                onClick={() => {
                                  setSelectedNote(note);
                                  setShowEditNoteDialog(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Edit note"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={Trash2}
                                onClick={() => handleDeleteNote(note.id, note.title)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete note"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">No Notes Yet</h3>
                      <p className="text-text-tertiary mb-6">Start tracking important client information by adding your first note</p>
                      <Button 
                        icon={Plus}
                        onClick={() => setShowAddNoteDialog(true)}
                        className="bg-primary text-gray-900 hover:bg-primary-hover"
                      >
                        Add First Note
                      </Button>
                    </div>
                  )}
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
        
        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          isOpen={showAddTransactionDialog}
          onClose={() => setShowAddTransactionDialog(false)}
          onSubmit={handleAddTransaction}
          loading={isAddingTransaction}
        />
        
        {/* Add Note Dialog */}
        <AddNoteDialog
          isOpen={showAddNoteDialog}
          onClose={() => setShowAddNoteDialog(false)}
          onSubmit={handleAddNote}
          loading={notesLoading}
        />
        
        {/* Edit Note Dialog */}
        <EditNoteDialog
          isOpen={showEditNoteDialog}
          onClose={() => {
            setShowEditNoteDialog(false);
            setSelectedNote(null);
          }}
          onSubmit={handleEditNote}
          note={selectedNote}
          loading={notesLoading}
        />
      </div>
    </div>
  );
}