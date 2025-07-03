import React, { useState } from 'react';
import { X, Calendar, User, Flag, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: 'general' | 'deadline' | 'follow_up' | 'review' | 'filing';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  client_id?: string;
  created_at: string;
  updated_at: string;
}

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

const priorityColors = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  high: 'text-red-600 bg-red-50'
};

const statusColors = {
  pending: 'text-gray-600 bg-gray-50',
  in_progress: 'text-blue-600 bg-blue-50',
  completed: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50'
};

const taskTypeLabels = {
  general: 'General',
  deadline: 'Deadline',
  follow_up: 'Follow Up',
  review: 'Review',
  filing: 'Filing'
};

export function TaskDetailDialog({ task, isOpen, onClose, onUpdate, onDelete }: TaskDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  if (!isOpen || !task) return null;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date
    });
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(task.id, editedTask);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTask({});
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'completed' && !task.completed_at) {
      updates.completed_at = new Date().toISOString();
    } else if (newStatus !== 'completed') {
      updates.completed_at = undefined;
    }
    
    if (onUpdate) {
      onUpdate(task.id, updates);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title
            </Label>
            {isEditing ? (
              <Input
                id="title"
                value={editedTask.title || ''}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-lg font-medium text-gray-900">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            {isEditing ? (
              <textarea
                id="description"
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1 text-gray-600">{task.description || 'No description provided'}</p>
            )}
          </div>

          {/* Task Type */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Type</Label>
            <p className="mt-1 text-gray-900">{taskTypeLabels[task.task_type]}</p>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Priority</Label>
              {isEditing ? (
                <select
                  value={editedTask.priority || task.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Task['priority'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                    <Flag className="w-3 h-3 mr-1" />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              {isEditing ? (
                <select
                  value={editedTask.status || task.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as Task['status'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                    {getStatusIcon(task.status)}
                    <span className="ml-1">{task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="due_date" className="text-sm font-medium text-gray-700">
              Due Date
            </Label>
            {isEditing ? (
              <Input
                id="due_date"
                type="datetime-local"
                value={editedTask.due_date ? new Date(editedTask.due_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="mt-1"
              />
            ) : (
              <div className="mt-1 flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(task.due_date)}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <Label className="text-xs font-medium text-gray-500">Created</Label>
              <p className="mt-1">{formatDate(task.created_at)}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500">Last Updated</Label>
              <p className="mt-1">{formatDate(task.updated_at)}</p>
            </div>
          </div>

          {task.completed_at && (
            <div className="text-sm text-gray-500">
              <Label className="text-xs font-medium text-gray-500">Completed</Label>
              <p className="mt-1">{formatDate(task.completed_at)}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-2">
            {!isEditing && task.status !== 'completed' && (
              <Button
                onClick={() => handleStatusChange('completed')}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Mark Complete
              </Button>
            )}
            {!isEditing && task.status === 'completed' && (
              <Button
                onClick={() => handleStatusChange('pending')}
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-600 hover:bg-gray-50"
              >
                <Circle className="w-4 h-4 mr-1" />
                Mark Incomplete
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm">
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} variant="outline" size="sm">
                  Edit
                </Button>
                {onDelete && (
                  <Button
                    onClick={() => onDelete(task.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}