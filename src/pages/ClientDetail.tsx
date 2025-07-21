import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useDocuments } from '../hooks/useDocuments';
import { useClientNotes } from '../hooks/useClientNotes';
import { TopBar } from '../components/organisms/TopBar';
import { GlobalSearch } from '../components/molecules/GlobalSearch';
import { useSearch } from '../contexts/SearchContext';
import { DocumentList } from '../components/ui/document-list';
import { EnhancedFileUpload } from '../components/ui/enhanced-file-upload';
import { AddNoteDialog } from '../components/ui/add-note-dialog';
import { EditNoteDialog } from '../components/ui/edit-note-dialog';
import { EditClientDialog } from '../components/ui/edit-client-dialog';
import { EnhancedDocumentPreview } from '../components/ui/enhanced-document-preview';
import { AddTransactionDialog } from '../components/ui/add-transaction-dialog';
import { EmptyState } from '../components/ui/empty-state';
import { useToast } from '../contexts/ToastContext';
import { Skeleton, SkeletonText } from '../components/ui/skeleton';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Input } from '../components/atoms/Input';
import { generateTransactionId } from '../lib/utils';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Plus, 
  Upload, 
  MessageSquare, 
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  Building,
  Tag,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  TrendingUp,
  Link2,
  AlertCircle,
  Search,
  Filter,
  X
} from 'lucide-react';

// Transaction interface
interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  merchant_name: string;
  source_document_type: string;
  status: 'confirmed' | 'high_confidence' | 'pending' | 'reconciled' | 'needs_review';
  confidence?: number;
  reconciled_with?: string;
  created_at: string;
  updated_at: string;
}

// Reconciliation queue item interface
interface ReconciliationQueueItem {
  id: string;
  newTransaction: Transaction;
  match?: Transaction;
  matches?: Transaction[];
  confidence?: number;
  type?: 'single_match' | 'multiple_matches';
}

// String similarity calculation
const calculateSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Simple string similarity algorithm
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance calculation
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Calculate match confidence
const calculateMatchConfidence = (transaction1: Transaction, transaction2: Transaction): number => {
  const weights = {
    amount: 0.4,
    merchant: 0.3,
    date: 0.2,
    description: 0.1
  };
  
  // Amount similarity (exact match = 1, within 1% = 0.9, etc.)
  const amountDiff = Math.abs(transaction1.amount - transaction2.amount) / transaction1.amount;
  const amountScore = Math.max(0, 1 - (amountDiff * 10));
  
  // Merchant name similarity
  const merchantScore = calculateSimilarity(transaction1.merchant_name, transaction2.merchant_name);
  
  // Date proximity (same day = 1, 1 day apart = 0.8, etc.)
  const dateDiff = Math.abs(new Date(transaction1.date).getTime() - new Date(transaction2.date).getTime()) / (24 * 60 * 60 * 1000);
  const dateScore = Math.max(0, 1 - (dateDiff * 0.2));
  
  // Description similarity
  const descriptionScore = calculateSimilarity(transaction1.description, transaction2.description);
  
  return (
    weights.amount * amountScore +
    weights.merchant * merchantScore +
    weights.date * dateScore +
    weights.description * descriptionScore
  );
};

// Auto-reconciliation function
const attemptAutoReconciliation = (newTransaction: Transaction, existingTransactions: Transaction[]) => {
  const potentialMatches = existingTransactions.filter(existing => {
    // Skip already reconciled transactions
    if (existing.reconciled_with || existing.status === 'reconciled') return false;
    
    // Amount matching with 5% tolerance
    const amountMatch = Math.abs(existing.amount - newTransaction.amount) <= (newTransaction.amount * 0.05);
    
    // Date matching within 7 days
    const existingDate = new Date(existing.date);
    const newDate = new Date(newTransaction.date);
    const dateDiff = Math.abs(existingDate.getTime() - newDate.getTime());
    const dateMatch = dateDiff <= (7 * 24 * 60 * 60 * 1000);
    
    // Merchant name similarity
    const merchantMatch = calculateSimilarity(existing.merchant_name, newTransaction.merchant_name) > 0.8;
    
    return amountMatch && dateMatch && merchantMatch;
  });
  
  if (potentialMatches.length === 1) {
    const match = potentialMatches[0];
    const confidence = calculateMatchConfidence(newTransaction, match);
    
    if (confidence > 0.95) {
      return { action: 'auto_reconcile', match, confidence };
    } else if (confidence > 0.75) {
      return { action: 'review_required', match, confidence };
    }
  } else if (potentialMatches.length > 1) {
    return { action: 'multiple_matches', matches: potentialMatches };
  }
  
  return { action: 'no_match' };
};

// Status Badge Component
const StatusBadge: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const statusConfig = {
    'confirmed': { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle2,
      label: 'Confirmed (Bank)' 
    },
    'high_confidence': { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: TrendingUp,
      label: 'High Confidence (Receipt)' 
    },
    'pending': { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: Clock,
      label: 'Pending (Invoice)' 
    },
    'reconciled': { 
      color: 'bg-purple-100 text-purple-800 border-purple-200', 
      icon: Link2,
      label: 'Reconciled' 
    },
    'needs_review': { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: AlertCircle,
      label: 'Needs Review' 
    }
  };
  
  const config = statusConfig[transaction.status] || statusConfig['pending'];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

// Confidence Indicator Component
const ConfidenceIndicator: React.FC<{ confidence: number }> = ({ confidence }) => {
  const getConfidenceConfig = (level: number) => {
    if (level >= 95) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' };
    if (level >= 85) return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'High' };
    if (level >= 70) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medium' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Low' };
  };
  
  const config = getConfidenceConfig(confidence);
  
  return (
    <div className="flex items-center space-x-1">
      <div className={`w-2 h-2 rounded-full ${config.bg}`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {confidence}% {config.label}
      </span>
    </div>
  );
};

// Transaction Preview Component
const TransactionPreview: React.FC<{ 
  transaction: Transaction; 
  title: string; 
  badgeColor: string; 
}> = ({ transaction, title, badgeColor }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-gray-700 text-sm">{title}:</p>
        <span className={`px-2 py-1 rounded-full text-xs ${badgeColor}`}>
          {transaction.source_document_type}
        </span>
      </div>
      <div className="text-sm space-y-1">
        <p className="font-medium">{transaction.description}</p>
        <p className="text-gray-600">{transaction.merchant_name}</p>
        <div className="flex justify-between">
          <span>${transaction.amount.toFixed(2)}</span>
          <span>{transaction.date}</span>
        </div>
      </div>
    </div>
  );
};

// Reconciliation Item Component
const ReconciliationItem: React.FC<{
  item: ReconciliationQueueItem;
  onApprove: () => void;
  onReject: () => void;
}> = ({ item, onApprove, onReject }) => {
  const confidenceColor = (item.confidence || 0) >= 0.9 ? 'text-green-600' :
                         (item.confidence || 0) >= 0.7 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-amber-800">Potential Match Found</h5>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${confidenceColor}`}>
            {Math.round((item.confidence || 0) * 100)}% confidence
          </span>
          <div className={`w-2 h-2 rounded-full ${
            (item.confidence || 0) >= 0.9 ? 'bg-green-500' :
            (item.confidence || 0) >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TransactionPreview 
          transaction={item.newTransaction} 
          title="New Transaction"
          badgeColor="bg-blue-100 text-blue-800"
        />
        {item.match && (
          <TransactionPreview 
            transaction={item.match} 
            title="Existing Transaction"
            badgeColor="bg-gray-100 text-gray-800"
          />
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={onApprove}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Approve Match
        </button>
        <button
          onClick={onReject}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Keep Separate
        </button>
      </div>
    </div>
  );
};

// Reconciliation Queue Component
const ReconciliationQueue: React.FC<{
  reconciliationQueue: ReconciliationQueueItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
}> = ({ reconciliationQueue, onApprove, onReject, onApproveAll, onRejectAll }) => {
  return (
    <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-text-primary">Reconciliation Queue</h4>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-text-secondary">
            {reconciliationQueue.length} item(s) pending
          </span>
          {reconciliationQueue.length > 0 && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={onApproveAll}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                Approve All High Confidence
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRejectAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Reject All
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {reconciliationQueue.length > 0 ? (
        <div className="space-y-4">
          {reconciliationQueue.map(item => (
            <ReconciliationItem 
              key={item.id} 
              item={item}
              onApprove={() => onApprove(item.id)}
              onReject={() => onReject(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-text-tertiary">All transactions are reconciled</p>
        </div>
      )}
    </div>
  );
};

// Transaction Filters Component
const TransactionFilters: React.FC<{
  filters: any;
  onFiltersChange: (filters: any) => void;
}> = ({ filters, onFiltersChange }) => {
  const filterOptions = {
    status: [
      { value: 'all', label: 'All Statuses' },
      { value: 'confirmed', label: 'Confirmed (Bank)' },
      { value: 'high_confidence', label: 'High Confidence' },
      { value: 'pending', label: 'Pending' },
      { value: 'reconciled', label: 'Reconciled' },
      { value: 'needs_review', label: 'Needs Review' }
    ],
    documentType: [
      { value: 'all', label: 'All Documents' },
      { value: 'bank_statement', label: 'Bank Statements' },
      { value: 'receipt', label: 'Receipts' },
      { value: 'invoice', label: 'Invoices' }
    ],
    confidence: [
      { value: 'all', label: 'All Confidence Levels' },
      { value: 'high', label: 'High (85%+)' },
      { value: 'medium', label: 'Medium (70-84%)' },
      { value: 'low', label: 'Low (<70%)' }
    ]
  };
  
  return (
    <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft mb-6">
      <h4 className="font-medium text-text-primary mb-4">Filter Transactions</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <Input
              placeholder="Description, merchant, amount..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {filterOptions.status.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Document Type Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Document Type
          </label>
          <select
            value={filters.documentType || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, documentType: e.target.value })}
            className="w-full px-3 py-2 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {filterOptions.documentType.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Confidence Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Confidence Level
          </label>
          <select
            value={filters.confidence || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, confidence: e.target.value })}
            className="w-full px-3 py-2 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {filterOptions.confidence.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Date Range Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            className="w-full px-3 py-2 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            className="w-full px-3 py-2 border border-border-subtle rounded-xl bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Clear Filters Button */}
      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({})}
          className="text-primary hover:text-primary-hover"
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
};

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading, updateClient } = useClients();
  const { documents, loading: documentsLoading, refreshDocuments, getDocumentPreviewURL, downloadDocument } = useDocuments(id);
  const { notes, loading: notesLoading, createNote, updateNote, deleteNote } = useClientNotes(id || '');
  const { isSearchOpen, closeSearch } = useSearch();
  const toast = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditNote, setShowEditNote] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Transaction and reconciliation state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [reconciliationQueue, setReconciliationQueue] = useState<ReconciliationQueueItem[]>([]);
  const [isProcessingDocuments, setIsProcessingDocuments] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [filters, setFilters] = useState<any>({});

  const client = clients.find(c => c.id === id);

  // Create transaction helper function
  const createTransaction = (data: any): Transaction => {
    return {
      id: generateTransactionId(),
      amount: data.amount || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || '',
      merchant_name: data.merchant_name || '',
      source_document_type: data.source_document_type || 'manual',
      status: data.status || 'pending',
      confidence: data.confidence || 70,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  // Process financial documents with reconciliation
  const handleProcessFinancialDocuments = async (files: File[]) => {
    setIsProcessingDocuments(true);
    
    try {
      console.log('🔄 Starting financial document processing...');
      
      // Mock financial document processing
      const financialDocs = documents.filter(doc => 
        doc.document_type === 'bank_statement' || 
        doc.document_type === 'receipt' || 
        doc.document_type === 'invoice'
      );
      
      console.log('📄 Found financial documents:', financialDocs.length);
      
      if (financialDocs.length === 0) {
        console.log('⚠️ No financial documents found');
        toast.info('No Financial Documents', 'No bank statements, receipts, or invoices found to process');
        setIsProcessingDocuments(false);
        return;
      }
      
      console.log('🤖 Processing documents with AI...');
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock transactions from documents
      const newTransactions = [];
      
      financialDocs.forEach((doc, index) => {
        // Generate 2-4 transactions per document
        const transactionCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < transactionCount; i++) {
          const transaction = createTransaction(doc, i);
          newTransactions.push(transaction);
        }
      });
      
      console.log('✅ Generated transactions:', newTransactions.length);
      
      // Add new transactions to state
      setTransactions(prev => [...prev, ...newTransactions]);
      
      // Attempt auto-reconciliation
      console.log('🔄 Starting auto-reconciliation...');
      const reconciliationResults = attemptAutoReconciliation(newTransactions);
      console.log('🔗 Auto-reconciliation results:', reconciliationResults);
      
      // Update reconciliation queue
      setReconciliationQueue(prev => [...prev, ...reconciliationResults.needsReview]);
      
      // Show success message
      toast.success(
        'Documents Processed', 
        `Generated ${newTransactions.length} transactions from ${financialDocs.length} documents. ${reconciliationResults.autoReconciled} auto-reconciled, ${reconciliationResults.needsReview.length} need review.`
      );
      
      console.log('✅ Financial document processing complete');
      
    } catch (error) {
      console.error('Failed to process financial documents:', error);
      toast.error('Processing Failed', error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessingDocuments(false);
    }
  };

  // Reconciliation approval/rejection functions
  const approveReconciliation = (queueItemId: string) => {
    const queueItem = reconciliationQueue.find(item => item.id === queueItemId);
    if (!queueItem || !queueItem.match) return;
    
    const { newTransaction, match } = queueItem;
    
    // Update both transactions to reconciled status
    const reconciledNewTransaction = {
      ...newTransaction,
      status: 'reconciled' as const,
      reconciled_with: match.id,
      updated_at: new Date().toISOString()
    };
    
    // Add new transaction to main list
    setTransactions(prev => [
      ...prev.map(t => 
        t.id === match.id 
          ? { ...t, status: 'reconciled' as const, reconciled_with: newTransaction.id, updated_at: new Date().toISOString() }
          : t
      ),
      reconciledNewTransaction
    ]);
    
    // Remove from pending transactions if it exists
    setPendingTransactions(prev => prev.filter(t => t.id !== newTransaction.id));
    
    // Remove from reconciliation queue
    setReconciliationQueue(prev => prev.filter(item => item.id !== queueItemId));
    
    // Show success message
    toast.success('Reconciliation Approved', 'Transactions successfully reconciled!');
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
    
    toast.info('Reconciliation Rejected', 'Transactions kept separate');
  };

  // Bulk reconciliation functions
  const approveAllReconciliations = () => {
    const highConfidenceItems = reconciliationQueue.filter(item => (item.confidence || 0) >= 0.85);
    
    if (highConfidenceItems.length === 0) {
      toast.warning('No Matches', 'No high-confidence matches to approve');
      return;
    }
    
    highConfidenceItems.forEach(item => {
      approveReconciliation(item.id);
    });
    
    toast.success('Bulk Approval', `Approved ${highConfidenceItems.length} high-confidence matches`);
  };

  const rejectAllReconciliations = () => {
    const currentQueue = [...reconciliationQueue];
    
    currentQueue.forEach(item => {
      rejectReconciliation(item.id);
    });
    
    toast.info('Bulk Rejection', `Rejected ${currentQueue.length} pending reconciliations`);
  };

  // Filter transactions
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          transaction.description.toLowerCase().includes(searchTerm) ||
          transaction.merchant_name.toLowerCase().includes(searchTerm) ||
          transaction.amount.toString().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (transaction.status !== filters.status) return false;
      }
      
      // Document type filter
      if (filters.documentType && filters.documentType !== 'all') {
        if (transaction.source_document_type !== filters.documentType) return false;
      }
      
      // Confidence filter
      if (filters.confidence && filters.confidence !== 'all') {
        const confidence = transaction.confidence || 0;
        switch (filters.confidence) {
          case 'high':
            if (confidence < 85) return false;
            break;
          case 'medium':
            if (confidence < 70 || confidence >= 85) return false;
            break;
          case 'low':
            if (confidence >= 70) return false;
            break;
        }
      }
      
      // Date range filter
      if (filters.dateFrom) {
        if (new Date(transaction.date) < new Date(filters.dateFrom)) return false;
      }
      if (filters.dateTo) {
        if (new Date(transaction.date) > new Date(filters.dateTo)) return false;
      }
      
      return true;
    });
  };

  // Event handlers
  const handleUploadComplete = (documentIds: string[]) => {
    toast.success('Upload Complete', `${documentIds.length} document(s) uploaded successfully`);
    refreshDocuments();
    setShowUpload(false);
  };

  const handleUploadError = (error: string) => {
    toast.error('Upload Failed', error);
  };

  const handleCreateNote = async (noteData: any) => {
    const result = await createNote(noteData);
    if (result.success) {
      toast.success('Note Created', 'Note has been added successfully');
    } else {
      toast.error('Failed to create note', result.error);
      throw new Error(result.error);
    }
  };

  const handleUpdateNote = async (noteData: any) => {
    if (!selectedNote) return;
    
    const result = await updateNote(selectedNote.id, noteData);
    if (result.success) {
      toast.success('Note Updated', 'Note has been updated successfully');
    } else {
      toast.error('Failed to update note', result.error);
      throw new Error(result.error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const result = await deleteNote(noteId);
      if (result.success) {
        toast.success('Note Deleted', 'Note has been deleted successfully');
      } else {
        toast.error('Failed to delete note', result.error);
      }
    }
  };

  const handleUpdateClient = async (clientData: any) => {
    if (!client) return;
    
    try {
      await updateClient(client.id, {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        tax_year: clientData.taxYear,
        entity_type: clientData.entityType as any
      });
      toast.success('Client Updated', 'Client information has been updated successfully');
    } catch (error: any) {
      toast.error('Update Failed', error.message);
      throw error;
    }
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      const result = await getDocumentPreviewURL(documentId);
      if (result.url) {
        const doc = documents.find(d => d.id === documentId);
        setSelectedDocument(doc);
        setPreviewUrl(result.url);
        setShowPreview(true);
      } else {
        toast.error('Preview Failed', result.error || 'Failed to generate preview URL');
      }
    } catch (error: any) {
      toast.error('Preview Failed', error.message);
    }
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const result = await downloadDocument(documentId, filename);
      if (!result.success) {
        toast.error('Download Failed', result.error || 'Failed to download document');
      }
    } catch (error: any) {
      toast.error('Download Failed', error.message);
    }
  };

  const handleAddTransaction = async (transactionData: any) => {
    const newTransaction = createTransaction({
      ...transactionData,
      source_document_type: 'manual',
      status: 'high_confidence'
    });
    
    setTransactions(prev => [...prev, newTransaction]);
    toast.success('Transaction Added', 'Transaction has been added successfully');
  };

  if (clientsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
        <TopBar title="Loading..." />
        <div className="max-w-content mx-auto px-8 py-8">
          <Skeleton className="h-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
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
            description="The client you're looking for doesn't exist or you don't have permission to view it."
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

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar 
        title={client.name}
        breadcrumbItems={[
          { label: 'Clients', href: '/clients' },
          { label: client.name }
        ]}
        action={{
          label: 'Edit Client',
          onClick: () => setShowEditClient(true),
          icon: Edit
        }}
      />

      {/* Global Search */}
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      
      <div className="max-w-content mx-auto px-8 py-8">
        {/* Client Header */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 shadow-soft mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-xl font-bold text-gray-900">
                  {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">{client.name}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-secondary">Tax Year {client.tax_year}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-secondary capitalize">{client.entity_type.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="success">Active</Badge>
              <Button
                variant="secondary"
                icon={Edit}
                onClick={() => setShowEditClient(true)}
              >
                Edit Client
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle mb-8 shadow-soft">
          <div className="flex space-x-1 p-2">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'transactions', label: 'Transactions', icon: DollarSign },
              { id: 'notes', label: 'Notes', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-gray-900 shadow-soft'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Stats */}
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

              {/* Reconciliation Queue */}
              <ReconciliationQueue
                reconciliationQueue={reconciliationQueue}
                onApprove={approveReconciliation}
                onReject={rejectReconciliation}
                onApproveAll={approveAllReconciliations}
                onRejectAll={rejectAllReconciliations}
              />

              {/* Recent Activity */}
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {documents.slice(0, 3).map(doc => (
                    <div key={doc.id} className="flex items-center space-x-3 p-3 bg-surface rounded-xl">
                      <FileText className="w-5 h-5 text-text-tertiary" />
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{doc.original_filename}</p>
                        <p className="text-sm text-text-tertiary">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
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
                    onClick={() => setShowAddTransaction(true)}
                  >
                    Add Transaction
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start" 
                    icon={MessageSquare}
                    onClick={() => setShowAddNote(true)}
                  >
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                <h3 className="font-semibold text-text-primary mb-4">Client Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-text-tertiary">Entity Type:</span>
                    <span className="ml-2 font-medium text-text-primary capitalize">
                      {client.entity_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Tax Year:</span>
                    <span className="ml-2 font-medium text-text-primary">{client.tax_year}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Status:</span>
                    <span className="ml-2">
                      <Badge variant="success" size="sm">{client.status}</Badge>
                    </span>
                  </div>
                  {client.address && (
                    <div>
                      <span className="text-text-tertiary">Address:</span>
                      <p className="mt-1 text-text-primary">{client.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-text-primary">Documents</h2>
              <Button 
                icon={Upload}
                onClick={() => setShowUpload(true)}
                className="bg-primary text-gray-900 hover:bg-primary-hover"
              >
                Upload Documents
              </Button>
            </div>

            {showUpload && (
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-text-primary">Upload Documents</h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowUpload(false)}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <EnhancedFileUpload
                  clientId={client.id}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </div>
            )}

            <DocumentList
              documents={documents}
              loading={documentsLoading}
              onPreview={handlePreviewDocument}
              onDownload={handleDownloadDocument}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-text-primary">Transactions</h2>
              <div className="flex space-x-3">
                <Button 
                  variant="secondary"
                  icon={Upload}
                  onClick={() => setShowUpload(true)}
                >
                  Process Documents
                </Button>
                <Button 
                  icon={Plus}
                  onClick={() => setShowAddTransaction(true)}
                  className="bg-primary text-gray-900 hover:bg-primary-hover"
                >
                  Add Transaction
                </Button>
              </div>
            </div>

            {/* Transaction Filters */}
            <TransactionFilters
              filters={filters}
              onFiltersChange={setFilters}
            />

            {/* Reconciliation Queue */}
            {reconciliationQueue.length > 0 && (
              <ReconciliationQueue
                reconciliationQueue={reconciliationQueue}
                onApprove={approveReconciliation}
                onReject={rejectReconciliation}
                onApproveAll={approveAllReconciliations}
                onRejectAll={rejectAllReconciliations}
              />
            )}

            {/* Processing Message */}
            {processingMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800">{processingMessage}</p>
              </div>
            )}

            {/* Transactions List */}
            {filteredTransactions.length > 0 ? (
              <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface border-b border-border-subtle">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Confidence
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Source
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-surface-hover transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-text-primary">{transaction.description}</div>
                              <div className="text-sm text-text-tertiary">{transaction.merchant_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-text-primary">
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge transaction={transaction} />
                          </td>
                          <td className="px-6 py-4">
                            {transaction.confidence && (
                              <ConfidenceIndicator confidence={transaction.confidence} />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="neutral" size="sm" className="capitalize">
                              {transaction.source_document_type.replace('_', ' ')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={DollarSign}
                title={Object.keys(filters).length > 0 ? "No transactions match your filters" : "No transactions yet"}
                description={Object.keys(filters).length > 0 
                  ? "Try adjusting your search or filters to find what you're looking for"
                  : "Upload financial documents or add transactions manually to get started"
                }
                action={Object.keys(filters).length === 0 ? {
                  label: "Add First Transaction",
                  onClick: () => setShowAddTransaction(true),
                  icon: Plus
                } : undefined}
              />
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
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
                  <div key={i} className="bg-surface-elevated rounded-xl p-6 border border-border-subtle">
                    <Skeleton className="h-6 w-1/3 mb-3" />
                    <SkeletonText lines={3} />
                  </div>
                ))}
              </div>
            ) : notes.length > 0 ? (
              <div className="space-y-4">
                {notes.map(note => (
                  <div key={note.id} className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-text-primary">{note.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={note.priority === 'high' ? 'error' : note.priority === 'medium' ? 'warning' : 'neutral'} 
                          size="sm"
                        >
                          {note.priority} priority
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => {
                            setSelectedNote(note);
                            setShowEditNote(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-700"
                        />
                      </div>
                    </div>
                    
                    <p className="text-text-secondary mb-3 whitespace-pre-line">{note.content}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <Badge variant="neutral" size="sm" className="capitalize">
                          {note.category.replace('_', ' ')}
                        </Badge>
                        {note.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-text-tertiary" />
                            <span className="text-text-tertiary">{note.tags.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-text-tertiary">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No notes yet"
                description="Add notes to keep track of important information about this client"
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

      {/* Dialogs */}
      <AddNoteDialog
        isOpen={showAddNote}
        onClose={() => setShowAddNote(false)}
        onSubmit={handleCreateNote}
      />

      <EditNoteDialog
        isOpen={showEditNote}
        onClose={() => {
          setShowEditNote(false);
          setSelectedNote(null);
        }}
        onSubmit={handleUpdateNote}
        note={selectedNote}
      />

      <EditClientDialog
        isOpen={showEditClient}
        onClose={() => setShowEditClient(false)}
        onSubmit={handleUpdateClient}
        client={client}
      />

      <AddTransactionDialog
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSubmit={handleAddTransaction}
      />

      {/* Document Preview */}
      {showPreview && selectedDocument && previewUrl && (
        <EnhancedDocumentPreview
          document={selectedDocument}
          previewUrl={previewUrl}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedDocument(null);
            setPreviewUrl(null);
          }}
          onDownload={() => handleDownloadDocument(selectedDocument.id, selectedDocument.original_filename)}
        />
      )}
    </div>
  );
}