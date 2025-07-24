import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CreditCard, 
  Receipt,
  Calendar
} from 'lucide-react';
import { StatCard } from '../atoms/StatCard';
import { Badge } from '../atoms/Badge';
import { TransactionSummary as TransactionSummaryType } from '../../hooks/useTransactions';

interface TransactionSummaryProps {
  summary: TransactionSummaryType;
  loading?: boolean;
  className?: string;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  summary,
  loading = false,
  className,
}) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getNetAmountTrend = () => {
    if (summary.netAmount > 0) return 'up';
    if (summary.netAmount < 0) return 'down';
    return 'neutral';
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-elevated rounded-xl p-6 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-surface rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-surface rounded w-20" />
                <div className="h-6 bg-surface rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary.totalIncome)}
          change={`${summary.transactionCount} transactions`}
          icon={TrendingUp}
          trend="up"
        />
        
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          change={`${Object.values(summary.bySource).length} sources`}
          icon={TrendingDown}
          trend="down"
        />
        
        <StatCard
          title="Net Amount"
          value={formatCurrency(summary.netAmount)}
          change={summary.netAmount >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
          icon={DollarSign}
          trend={getNetAmountTrend()}
        />
        
        <StatCard
          title="Total Transactions"
          value={summary.transactionCount}
          change={`${Object.keys(summary.byMonth).length} months`}
          icon={FileText}
          trend="neutral"
        />
      </div>

      {/* Breakdown by Source */}
      <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Breakdown by Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(summary.bySource).map(([source, amount]) => {
            const getSourceIcon = () => {
              switch (source) {
                case 'bank_statement':
                  return <CreditCard className="w-5 h-5 text-blue-600" />;
                case 'invoice':
                  return <FileText className="w-5 h-5 text-purple-600" />;
                case 'receipt':
                  return <Receipt className="w-5 h-5 text-green-600" />;
                default:
                  return <FileText className="w-5 h-5 text-gray-600" />;
              }
            };

            const getSourceLabel = () => {
              switch (source) {
                case 'bank_statement':
                  return 'Bank Statements';
                case 'invoice':
                  return 'Invoices';
                case 'receipt':
                  return 'Receipts';
                default:
                  return source;
              }
            };

            return (
              <div key={source} className="bg-surface rounded-lg p-4 border border-border-subtle">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-surface-elevated rounded-lg">
                    {getSourceIcon()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">{getSourceLabel()}</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {formatCurrency(amount)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Transaction Status</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(summary.byStatus).map(([status, count]) => {
            const getStatusVariant = () => {
              switch (status) {
                case 'paid':
                case 'cleared':
                  return 'success';
                case 'pending':
                  return 'warning';
                case 'overdue':
                  return 'error';
                default:
                  return 'neutral';
              }
            };

            return (
              <div key={status} className="flex items-center space-x-2">
                <Badge variant={getStatusVariant()} size="sm">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <span className="text-sm text-text-secondary">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Breakdown */}
      {Object.keys(summary.byMonth).length > 0 && (
        <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Monthly Activity</h3>
          <div className="space-y-3">
            {Object.entries(summary.byMonth)
              .sort(([a], [b]) => b.localeCompare(a)) // Sort by month descending
              .slice(0, 6) // Show last 6 months
              .map(([month, amount]) => {
                const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                });
                
                return (
                  <div key={month} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-subtle">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-text-tertiary" />
                      <span className="font-medium text-text-primary">{monthName}</span>
                    </div>
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};