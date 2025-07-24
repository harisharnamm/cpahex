import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  CreditCard, 
  Receipt, 
  Building, 
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Download
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Input } from '../atoms/Input';
import { UnifiedTransaction } from '../../hooks/useTransactions';
import { cn } from '../../lib/utils';

interface TransactionListProps {
  transactions: UnifiedTransaction[];
  loading?: boolean;
  onViewDocument?: (documentId: string) => void;
  className?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading = false,
  onViewDocument,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchQuery || 
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.counterparty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = sourceFilter === 'all' || transaction.document_source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || transaction.payment_status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.debit_credit === typeFilter;
    
    return matchesSearch && matchesSource && matchesStatus && matchesType;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'bank_statement':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'receipt':
        return <Receipt className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'bank_statement':
        return 'Bank Statement';
      case 'invoice':
        return 'Invoice';
      case 'receipt':
        return 'Receipt';
      default:
        return source;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'cleared':
        return <Badge variant="success" size="sm">Cleared</Badge>;
      case 'overdue':
        return <Badge variant="error" size="sm">Overdue</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Unknown</Badge>;
    }
  };

  const getAmountDisplay = (transaction: UnifiedTransaction) => {
    const amount = transaction.amount || 0;
    const isCredit = transaction.debit_credit === 'credit';
    
    return (
      <div className={cn(
        "flex items-center space-x-1 font-semibold",
        isCredit ? "text-green-600" : "text-red-600"
      )}>
        {isCredit ? (
          <ArrowDownLeft className="w-4 h-4" />
        ) : (
          <ArrowUpRight className="w-4 h-4" />
        )}
        <span>
          {isCredit ? '+' : '-'}${amount.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </span>
      </div>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface-elevated rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-surface rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-surface rounded w-32" />
                  <div className="h-3 bg-surface rounded w-24" />
                </div>
              </div>
              <div className="h-6 bg-surface rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters */}
      <div className="bg-surface-elevated rounded-xl border border-border-subtle p-4 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Sources</option>
            <option value="bank_statement">Bank Statement</option>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cleared">Cleared</option>
            <option value="overdue">Overdue</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="credit">Income</option>
            <option value="debit">Expenses</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-surface-elevated rounded-xl border border-border-subtle p-8 text-center shadow-soft">
          <DollarSign className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'No transactions match your filters' 
              : 'No transactions found'
            }
          </h3>
          <p className="text-text-tertiary">
            {searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload financial documents to extract transactions automatically'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface-elevated rounded-xl border border-border-subtle p-4 hover:shadow-medium transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Source Icon */}
                  <div className="flex-shrink-0 p-2 bg-surface rounded-lg">
                    {getSourceIcon(transaction.document_source)}
                  </div>
                  
                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-semibold text-text-primary truncate">
                        {transaction.description || 'No description'}
                      </h4>
                      <Badge variant="neutral" size="sm">
                        {getSourceLabel(transaction.document_source)}
                      </Badge>
                      {getStatusBadge(transaction.payment_status)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-tertiary">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(transaction.transaction_date)}</span>
                      </div>
                      
                      {transaction.counterparty && (
                        <div className="flex items-center space-x-1">
                          <Building className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{transaction.counterparty}</span>
                        </div>
                      )}
                      
                      {transaction.reference_number && (
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>Ref: {transaction.reference_number}</span>
                        </div>
                      )}
                      
                      {transaction.transaction_type && (
                        <span className="capitalize">{transaction.transaction_type.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Amount and Actions */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  {getAmountDisplay(transaction)}
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {transaction.document_id && onViewDocument && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => onViewDocument(transaction.document_id!)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="View source document"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expandable Details */}
              {(transaction.line_items || transaction.invoice_number || transaction.due_date) && (
                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-text-tertiary">
                    {transaction.invoice_number && (
                      <div>
                        <span className="font-medium">Invoice:</span> {transaction.invoice_number}
                      </div>
                    )}
                    
                    {transaction.due_date && (
                      <div>
                        <span className="font-medium">Due Date:</span> {formatDate(transaction.due_date)}
                      </div>
                    )}
                    
                    {transaction.payment_method && (
                      <div>
                        <span className="font-medium">Payment Method:</span> {transaction.payment_method}
                      </div>
                    )}
                  </div>
                  
                  {/* Line Items Preview */}
                  {transaction.line_items && Array.isArray(transaction.line_items) && transaction.line_items.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-text-tertiary">Items:</span>
                      <div className="mt-1 space-y-1">
                        {transaction.line_items.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs text-text-tertiary">
                            <span className="truncate">{item.description || 'Item'}</span>
                            <span>${(item.amount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                        {transaction.line_items.length > 3 && (
                          <div className="text-xs text-text-tertiary">
                            +{transaction.line_items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredTransactions.length > 0 && (
        <div className="text-center text-sm text-text-tertiary">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      )}
    </div>
  );
};