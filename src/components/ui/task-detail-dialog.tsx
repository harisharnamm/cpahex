import React, { useState } from 'react';
import { X, Calendar, User, Flag, FileText, Clock, CheckCircle, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Task } from '../../hooks/useTasks';
import { ClientWithDocuments } from '../../hooks/useClients';

interface TaskDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  clients: ClientWithDocuments[];
  onMarkComplete: (taskId: string) => Promise<void>;
  onMarkPending: (taskId: string) => Promise<void>;
  onMarkInProgress: (taskId: string) => Promise<void>;
  onDelete: (taskId: string, taskTitle: string) => Promise<void>;
  onEdit?: (task: Task) => void;
}

export function TaskDetailDialog({
  isOpen,
  onClose,
  task,
  clients,
  onMarkComplete,
  onMarkPending,
  onMarkInProgress,
  onDelete,
  onEdit
}: TaskDetailDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !task) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'pending':
        return <Badge variant="neutral">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="error">High Priority</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium Priority</Badge>;
      default:
        return <Badge variant="neutral">Low Priority</Badge>;
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'General Task';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day(s)`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} day(s)`;
    }
  };

  const handleMarkComplete = async () => {
    setIsUpdatingStatus(true);
    try {
      await onMarkComplete(task.id);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkPending = async () => {
    setIsUpdatingStatus(true);
    try {
      await onMarkPending(task.id);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkInProgress = async () => {
    setIsUpdatingStatus(true);
    try {
      await onMarkInProgress(task.id);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await onDelete(task.id, task.title);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-2xl shadow-premium max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Task Details</h2>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusBadge(task.status)}
                {getPriorityBadge(task.priority)}
              </div>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Title */}
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">{task.title}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral" size="sm" className="capitalize">
                {task.task_type.replace('_', ' ')}
              </Badge>
              {new Date().getTime() - new Date(task.created_at).getTime() < 24 * 60 * 60 * 1000 && (
                <Badge variant="warning" size="sm">NEW</Badge>
              )}
            </div>
          </div>

          {/* Task Description */}
          {task.description && (
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Description</h4>
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <div className="text-text-secondary whitespace-pre-line">
                  {task.description}
                </div>
              </div>
            </div>
          )}

          {/* Task Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Client</h4>
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-text-tertiary" />
                  <span className="text-text-secondary">{getClientName(task.client_id)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-2">Due Date</h4>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-text-tertiary" />
                  <span className={task.due_date && new Date(task.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-text-secondary'}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'} 
                    {task.due_date && ` (${formatDate(task.due_date)})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-text-primary mb-2">Priority</h4>
                <div className="flex items-center space-x-2">
                  <Flag className="w-5 h-5 text-text-tertiary" />
                  <span className="text-text-secondary capitalize">{task.priority} priority</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-2">Created</h4>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-text-tertiary" />
                  <span className="text-text-secondary">{new Date(task.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Info */}
          {task.status === 'completed' && task.completed_at && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-emerald-800">Completed</h4>
                  <p className="text-sm text-emerald-700">
                    {new Date(task.completed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-surface">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                icon={Trash2}
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 w-full sm:w-auto"
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </Button>
              
              {onEdit && (
                <Button
                  variant="secondary"
                  icon={Pencil}
                  onClick={() => {
                    onEdit(task);
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  Edit Task
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {task.status === 'completed' ? (
                <Button
                  variant="secondary"
                  icon={RotateCcw}
                  onClick={handleMarkPending}
                  disabled={isUpdatingStatus}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 w-full sm:w-auto"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Mark as Pending'}
                </Button>
              ) : task.status === 'pending' ? (
                <>
                  <Button
                    variant="secondary"
                    icon={Clock}
                    onClick={handleMarkInProgress}
                    disabled={isUpdatingStatus}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200 w-full sm:w-auto"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Mark In Progress'}
                  </Button>
                  <Button
                    variant="primary"
                    icon={CheckCircle}
                    onClick={handleMarkComplete}
                    disabled={isUpdatingStatus}
                    className="bg-primary text-gray-900 hover:bg-primary-hover w-full sm:w-auto"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Mark Complete'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  icon={CheckCircle}
                  onClick={handleMarkComplete}
                  disabled={isUpdatingStatus}
                  className="bg-primary text-gray-900 hover:bg-primary-hover w-full sm:w-auto"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Mark Complete'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}