import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { useClients } from '../hooks/useClients';
import { GlobalSearch } from '../components/molecules/GlobalSearch';
import { useSearch } from '../contexts/SearchContext';
import { AddTransactionDialog } from '../components/ui/add-transaction-dialog';
import { EditClientDialog } from '../components/ui/edit-client-dialog';
import { TopBar } from '../components/organisms/TopBar';
import { Search, Filter, FileText, Calendar, User, Upload, Download, Eye, Edit, DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, Banknote, Plus } from 'lucide-react';
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
  const { isSearchOpen, closeSearch, openSearch } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  
  // Use our document hooks
  const { documents, loading, downloadDocument, deleteDocument, getDocumentPreviewURL } = useDocuments(id);
  
  const tabs = ['Documents', 'Vendors', 'Bookkeeping', 'Notes'];
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
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
        <div className="bg-surface-elevated dark:bg-gray-900 rounded-2xl border border-border-subtle dark:border-gray-800 p-6 mb-8 shadow-soft">
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
          <Tab.List className="flex space-x-1 rounded-2xl bg-surface-elevated dark:bg-gray-900 border border-border-subtle dark:border-gray-800 p-2 mb-8 shadow-soft">
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `w-full rounded-xl py-3 text-sm font-semibold leading-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    selected
                      ? 'bg-gradient-to-r from-primary to-primary-hover dark:from-primary-light-dark dark:to-primary-light-dark/90 text-gray-900 shadow-soft'
                      : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white hover:bg-surface-hover dark:hover:bg-gray-800'
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
              <div className="bg-surface-elevated dark:bg-gray-900 rounded-2xl border border-border-subtle dark:border-gray-800 overflow-hidden shadow-soft">
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
              <div className="bg-surface-elevated dark:bg-gray-900 rounded-2xl border border-border-subtle dark:border-gray-800 p-6 shadow-soft">
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
              <div className="bg-surface-elevated dark:bg-gray-900 rounded-2xl border border-border-subtle dark:border-gray-800 p-8 shadow-soft">
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
              <div className="space-y-8">
                {/* Bookkeeping Overview */}
                <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">Financial Overview</h3>
                      <p className="text-text-tertiary">Track income, expenses, and financial documents</p>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="secondary" icon={FileText}>
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
                  <div className="bg-surface rounded-xl border border-border-subtle p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-text-primary">Financial Documents</h4>
                      <Button variant="ghost" size="sm" icon={Upload}>
                        Upload Documents
                      </Button>
                    </div>
                    
                    <div className="p-4 border border-dashed border-border-light rounded-xl bg-surface-elevated">
                      <div className="text-center py-6">
                        <Upload className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                        <h5 className="font-medium text-text-primary mb-1">Drop financial documents here</h5>
                        <p className="text-text-tertiary text-sm mb-3">Upload bank statements, invoices, receipts, or payroll documents</p>
                        <Button size="sm" variant="secondary" icon={FileText}>
                          Browse Files
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <EnhancedFileUpload
                        clientId={id}
                        allowMultiple={true}
                        onUploadComplete={(documentIds) => console.log('Uploaded documents:', documentIds)}
                        onUploadError={(error) => console.error('Upload error:', error)}
                      />
                    </div>
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
              <div className="bg-surface-elevated dark:bg-gray-900 rounded-2xl border border-border-subtle dark:border-gray-800 p-8 shadow-soft">
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
        
        {/* Add Transaction Dialog */}
        <AddTransactionDialog
          isOpen={showAddTransactionDialog}
          onClose={() => setShowAddTransactionDialog(false)}
          onSubmit={handleAddTransaction}
          loading={isAddingTransaction}
        />
      </div>
    </div>
  );
}