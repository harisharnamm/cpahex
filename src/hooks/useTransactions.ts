import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

export interface UnifiedTransaction {
  id: number;
  transaction_id: string;
  document_id?: string;
  client_id?: string;
  document_source: 'bank_statement' | 'invoice' | 'receipt';
  transaction_date?: string;
  description?: string;
  amount?: number;
  currency: string;
  transaction_type?: string;
  debit_credit?: 'debit' | 'credit';
  reference_number?: string;
  counterparty?: string;
  counterparty_address?: string;
  invoice_number?: string;
  due_date?: string;
  payment_status?: 'pending' | 'paid' | 'cleared' | 'overdue';
  payment_method?: string;
  matching_candidate: boolean;
  matched_transaction_ids?: string[];
  tags?: any;
  line_items?: any;
  raw_data?: any;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  byMonth: Record<string, number>;
}

export function useTransactions(clientId?: string) {
  const { user } = useAuthContext();
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    console.log('🔄 Fetching transactions for user:', user.id, 'client:', clientId);
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('unified_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      // Filter by client if provided
      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      console.log('✅ Fetched transactions:', data?.length || 0, 'transactions');
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, clientId]);

  const getTransactionSummary = useCallback((): TransactionSummary => {
    const summary: TransactionSummary = {
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      transactionCount: transactions.length,
      bySource: {},
      byStatus: {},
      byMonth: {}
    };

    transactions.forEach(transaction => {
      const amount = transaction.amount || 0;
      
      // Calculate income vs expenses based on debit_credit
      if (transaction.debit_credit === 'credit') {
        summary.totalIncome += amount;
      } else if (transaction.debit_credit === 'debit') {
        summary.totalExpenses += amount;
      }

      // Group by source
      const source = transaction.document_source;
      summary.bySource[source] = (summary.bySource[source] || 0) + amount;

      // Group by status
      const status = transaction.payment_status || 'unknown';
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

      // Group by month
      if (transaction.transaction_date) {
        const month = new Date(transaction.transaction_date).toISOString().substring(0, 7); // YYYY-MM
        summary.byMonth[month] = (summary.byMonth[month] || 0) + amount;
      }
    });

    summary.netAmount = summary.totalIncome - summary.totalExpenses;

    return summary;
  }, [transactions]);

  const getTransactionsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return transactions.filter(transaction => {
      if (!transaction.transaction_date) return false;
      const transactionDate = new Date(transaction.transaction_date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [transactions]);

  const getTransactionsBySource = useCallback((source: string) => {
    return transactions.filter(transaction => transaction.document_source === source);
  }, [transactions]);

  const getTransactionsByStatus = useCallback((status: string) => {
    return transactions.filter(transaction => transaction.payment_status === status);
  }, [transactions]);

  // Load transactions on mount
  useEffect(() => {
    console.log('🔄 useTransactions effect triggered, user:', user?.id, 'clientId:', clientId);
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    summary: getTransactionSummary(),
    getTransactionsByDateRange,
    getTransactionsBySource,
    getTransactionsByStatus,
    refreshTransactions: fetchTransactions,
    setError,
  };
}