import React, { useState } from 'react';
import { Zap, X, Calendar, Flag, User, FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Input } from '../atoms/Input';
import { EnrichedIRSNotice } from '../../types/documents';

interface AutoTaskConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskData: any) => void;
  notice: EnrichedIRSNotice | null;
  taskData: any;
  clients: Array<{ id: string; name: string; email: string }>;
}

export function AutoTaskConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  notice, 
  taskData, 
  clients 
}: AutoTaskConfirmDialogProps) {
  const [editableTaskData, setEditableTaskData] = useState(taskData);
  const [isEditing, setIsEditing] = useState(false);

  // Update editable data when taskData changes
  React.useEffect(() => {
    if (taskData) {
      setEditableTaskData(taskData);
    }
  }, [taskData]);

  if (!isOpen || !notice || !taskData) return null;

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'General Task';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyInfo = () => {
    if (!notice.deadline_date) return null;
    
    const deadline = new Date(notice.deadline_date);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline <= 0) {
      return { text: 'OVERDUE', color: 'text-red-600 bg-red-100', urgent: true };
    } else if (daysUntilDeadline <= 7) {
      return { text: `${daysUntilDeadline} days left`, color: 'text-red-600 bg-red-100', urgent: true };
    } else if (daysUntilDeadline <= 30) {
      return { text: `${daysUntilDeadline} days left`, color: 'text-amber-600 bg-amber-100', urgent: false };
    } else {
      return { text: `${daysUntilDeadline} days left`, color: 'text-green-600 bg-green-100', urgent: false };
    }
  };

  const urgencyInfo = getUrgencyInfo();

  const handleConfirm = () => {
    onConfirm(editableTaskData);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditableTaskData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-surface-elevated rounded-xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary rounded-xl shadow-soft">
              <Zap className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">🤖 AI Task Suggestion</h2>
              <p className="text-text-tertiary text-sm">Automatically generated task based on IRS notice analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Notice Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900">IRS Notice Detected</h3>
                  <p className="text-blue-700 text-sm">{notice.notice_type} - {notice.notice_number || 'No number'}</p>
                </div>
              </div>
              {urgencyInfo && (
                <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${urgencyInfo.color} ${urgencyInfo.urgent ? 'animate-pulse' : ''}`}>
                  {urgencyInfo.urgent && '🚨 '}{urgencyInfo.text}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Client:</span>
                  <span className="font-medium text-blue-900">{getClientName(notice.client_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tax Year:</span>
                  <span className="font-medium text-blue-900">{notice.tax_year || 'Not specified'}</span>
                </div>
              </div>
              <div className="space-y-2">
                {notice.amount_owed && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Amount Owed:</span>
                    <span className="font-semibold text-blue-900">${notice.amount_owed.toLocaleString()}</span>
                  </div>
                )}
                {notice.deadline_date && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">IRS Deadline:</span>
                    <span className="font-semibold text-blue-900">{new Date(notice.deadline_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI-Generated Task Preview */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Suggested Task</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={isEditing ? handleSaveEdit : handleEdit}
                className="text-primary hover:text-primary-hover"
              >
                {isEditing ? 'Save' : 'Edit'}
              </Button>
            </div>

            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Task Title</label>
                {isEditing ? (
                  <Input
                    value={editableTaskData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="font-medium"
                  />
                ) : (
                  <p className="font-semibold text-text-primary text-lg">{editableTaskData.title}</p>
                )}
              </div>

              {/* Task Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-text-tertiary" />
                  {isEditing ? (
                    <select
                      value={editableTaskData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="text-sm border border-border-subtle rounded-lg px-2 py-1"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  ) : (
                    <Badge 
                      variant={editableTaskData.priority === 'high' ? 'error' : editableTaskData.priority === 'medium' ? 'warning' : 'neutral'} 
                      size="sm"
                    >
                      {editableTaskData.priority} priority
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-text-tertiary" />
                  <Badge variant="neutral" size="sm" className="capitalize">
                    {editableTaskData.task_type.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-secondary">{getClientName(editableTaskData.client_id)}</span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Suggested Due Date</label>
                {isEditing ? (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      type="date"
                      value={editableTaskData.due_date}
                      onChange={(e) => handleInputChange('due_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-10 pr-4 py-2 border border-border-subtle rounded-lg text-sm w-full"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-text-tertiary" />
                    <span className="font-medium text-text-primary">
                      {new Date(editableTaskData.due_date).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      ({Math.ceil((new Date(editableTaskData.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now)
                    </span>
                  </div>
                )}
              </div>

              {/* Task Description Preview */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Task Description</label>
                {isEditing ? (
                  <textarea
                    value={editableTaskData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm resize-none"
                  />
                ) : (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-subtle max-h-40 overflow-y-auto">
                    <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                      {editableTaskData.description}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Confidence & Benefits */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-2">🤖 AI Analysis Benefits</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• ⚡ Automatically extracted key information from IRS notice</li>
                  <li>• 📅 Calculated optimal response timeline (5 days before IRS deadline)</li>
                  <li>• 🎯 Set appropriate priority based on urgency and amount</li>
                  <li>• 📋 Generated comprehensive action plan with AI recommendations</li>
                  <li>• 🔗 Linked to client for proper organization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-border-subtle bg-surface">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-sm text-text-tertiary">
              💡 This task was intelligently generated based on AI analysis of your IRS notice
            </div>
            
            <div className="flex space-x-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1 sm:flex-none sm:min-w-[100px]"
              >
                Skip for Now
              </Button>
              
              <Button
                onClick={handleConfirm}
                className="flex-1 sm:flex-none shadow-medium sm:min-w-[140px] bg-primary text-gray-900 hover:bg-primary-hover"
              >
                ✨ Create Task
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}