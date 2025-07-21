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

  // 2.1 Reconciliation Core Logic - Similarity Calculation Functions
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

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    
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

  // 2.2 Auto-Reconciliation Function
  const calculateMatchConfidence = (transaction1: any, transaction2: any): number => {
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

  const attemptAutoReconciliation = (newTransaction: any, existingTransactions: any[]) => {
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

  const toast = useToast();
  
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
    