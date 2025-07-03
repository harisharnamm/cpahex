import React, { useState } from 'react';
import { X, Calendar, User, Flag, FileText, Clock, Plus } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';
import { cn } from '../../lib/utils';

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description?: string;
    task_type: 'general' | 'deadline' | 'follow_up' | 'review' | 'filing';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    client_id?: string;
  }) => Promise<void>;
  clients: Array<{ id: string; name: string; email: string }>;
  loading?: boolean;
}

const taskTypes = [
  {
    id: 'general',
    name: 'General Task',
    description: 'Standard task or reminder',
    icon: FileText,
    color: 'blue'
  },
  {
    id: 'deadline',
    name: 'Deadline',
    description: 'Time-sensitive task with due date',
    icon: Clock,
    color: 'red'
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    description: 'Client or vendor follow-up',
    icon: User,
    color: 'green'
  },
  {
    id: 'review',
    name: 'Review',
    description: 'Document or case review',
    icon: FileText,
    color: 'purple'
  },
  {
    id: 'filing',
    name: 'Filing',
    description: 'Tax filing or submission',
    icon: Calendar,
    color: 'amber'
  }
];

const priorities = [
  { id: 'low', name: 'Low Priority', color: 'gray', description: 'Can be done when time permits' },
  { id: 'medium', name: 'Medium Priority', color: 'blue', description: 'Should be completed soon' },
  { id: 'high', name: 'High Priority', color: 'red', description: 'Urgent - needs immediate attention' }
];

export function CreateTaskDialog({ isOpen, onClose, onSubmit, clients, loading = false }: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'general' as const,
    priority: 'medium' as const,
    due_date: '',
    client_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        task_type: formData.task_type,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        client_id: formData.client_id || undefined,
      });
      
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        task_type: 'general',
        priority: 'medium',
        due_date: '',
        client_id: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      task_type: 'general',
      priority: 'medium',
      due_date: '',
      client_id: ''
    });
    setErrors({});
    onClose();
  };

  const getTypeColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      amber: 'bg-amber-50 border-amber-200 text-amber-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getPriorityColor = (color: string) => {
    const colors = {
      gray: 'bg-gray-50 border-gray-200 text-gray-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      red: 'bg-red-50 border-red-200 text-red-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-surface-elevated rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Create New Task</h2>
              <p className="text-text-tertiary text-sm">Add a new task to your workflow</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Task Title */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Task Title *</label>
              <Input
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={loading}
                error={errors.title}
              />
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Description</label>
              <textarea
                placeholder="Add task details and notes..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
                rows={3}
                className="w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 resize-none"
              />
            </div>

            {/* Client Association */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Client Association</label>
              <select
                value={formData.client_id}
                onChange={(e) => handleInputChange('client_id', e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
              >
                <option value="">General Task (No Client)</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-tertiary">
                Select a client to associate this task with, or leave blank for a general task
              </p>
            </div>

            {/* Task Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-text-primary">Task Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {taskTypes.map(type => {
                  const Icon = type.icon;
                  const isSelected = formData.task_type === type.id;
                  
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleInputChange('task_type', type.id)}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-medium",
                        isSelected 
                          ? `${getTypeColor(type.color)} border-current shadow-soft` 
                          : "border-border-subtle hover:border-border-light bg-surface-elevated"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-all duration-200",
                          isSelected 
                            ? "bg-white/50" 
                            : "bg-surface"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{type.name}</h4>
                          <p className="text-xs mt-1 opacity-75">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-text-primary">Priority Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {priorities.map(priority => {
                  const isSelected = formData.priority === priority.id;
                  
                  return (
                    <div
                      key={priority.id}
                      onClick={() => handleInputChange('priority', priority.id)}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-medium text-center",
                        isSelected 
                          ? `${getPriorityColor(priority.color)} border-current shadow-soft` 
                          : "border-border-subtle hover:border-border-light bg-surface-elevated"
                      )}
                    >
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Flag className="w-4 h-4" />
                        <span className="font-semibold text-sm">{priority.name}</span>
                      </div>
                      <p className="text-xs opacity-75">{priority.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">Due Date (Optional)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-12 pr-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                />
              </div>
              {errors.due_date && (
                <p className="text-sm text-red-600 font-medium">{errors.due_date}</p>
              )}
            </div>

            {/* Task Preview */}
            {formData.title && (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                <h4 className="font-semibold text-sm text-text-primary mb-3">Task Preview</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">{formData.title}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="neutral" size="sm" className="capitalize">
                        {formData.task_type.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={formData.priority === 'high' ? 'error' : formData.priority === 'medium' ? 'warning' : 'neutral'} 
                        size="sm"
                      >
                        {formData.priority} priority
                      </Badge>
                    </div>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-text-secondary">{formData.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-text-tertiary">
                    <span>
                      Client: {formData.client_id 
                        ? clients.find(c => c.id === formData.client_id)?.name || 'Unknown'
                        : 'General Task'
                      }
                    </span>
                    {formData.due_date && (
                      <span>Due: {new Date(formData.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 sm:p-6 border-t border-border-subtle bg-surface">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto sm:min-w-[100px]"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="w-full sm:w-auto shadow-medium sm:min-w-[140px] bg-primary text-gray-900 hover:bg-primary-hover"
              >
                {loading ? 'Creating...' : '✓ Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}