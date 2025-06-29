import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useClients } from '../hooks/useClients';
import { CreateTaskDialog } from '../components/ui/create-task-dialog';
import { TaskDetailDialog } from '../components/ui/task-detail-dialog';
import { TopBar } from '../components/organisms/TopBar';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Input } from '../components/atoms/Input';
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  Clock, 
  Calendar,
  User,
  RotateCcw,
  Trash2,
  Edit,
  AlertTriangle
} from 'lucide-react';
import { Task } from '../hooks/useTasks';

export function Tasks() {
  const { tasks, loading, updateTaskStatus, deleteTask, createTask } = useTasks();
  const { clients } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    task_type: 'general' | 'deadline' | 'follow_up' | 'review' | 'filing';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    client_id?: string;
  }) => {
    const result = await createTask(taskData);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || task.task_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  // Group tasks by status for better organization
  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    cancelled: filteredTasks.filter(t => t.status === 'cancelled'),
  };

  const handleMarkComplete = async (taskId: string) => {
    const result = await updateTaskStatus(taskId, 'completed');
    if (!result.success) {
      alert(`Failed to mark task as complete: ${result.error}`);
    }
  };

  const handleMarkPending = async (taskId: string) => {
    const result = await updateTaskStatus(taskId, 'pending');
    if (!result.success) {
      alert(`Failed to mark task as pending: ${result.error}`);
    }
  };

  const handleMarkInProgress = async (taskId: string) => {
    const result = await updateTaskStatus(taskId, 'in_progress');
    if (!result.success) {
      alert(`Failed to mark task as in progress: ${result.error}`);
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`)) {
      const result = await deleteTask(taskId);
      if (!result.success) {
        alert(`Failed to delete task: ${result.error}`);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="warning" size="sm">In Progress</Badge>;
      case 'pending':
        return <Badge variant="neutral" size="sm">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="error" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="error" size="sm">High Priority</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium Priority</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low Priority</Badge>;
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

  const TaskCard = ({ task }: { task: Task }) => (
    <div className={`group bg-surface-elevated rounded-xl border border-border-subtle p-5 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-200 h-full ${
      task.status === 'completed' ? 'opacity-75' : ''
    } h-full flex flex-col justify-between cursor-pointer`}
      onClick={() => setSelectedTask(task)}>
      {/* Header with title and badges */}
      <div className="flex flex-col mb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold text-lg truncate ${
            task.status === 'completed' ? 'line-through text-text-tertiary' : 'text-text-primary'
          } max-w-[80%]`}>
            {task.title}
          </h3>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Show "NEW" badge for tasks created in the last 24 hours */}
          {new Date().getTime() - new Date(task.created_at).getTime() < 24 * 60 * 60 * 1000 && (
            <Badge variant="warning" size="sm">NEW</Badge>
          )}
          <Badge variant="neutral" size="sm" className="capitalize">
            {task.task_type.replace('_', ' ')}
          </Badge>
        </div>
      </div>
      
      {/* Description */}
      {task.description && (
        <div className="bg-surface rounded-lg p-3 mb-3 border border-border-subtle">
          <div className="text-text-secondary text-sm leading-relaxed line-clamp-3 overflow-hidden">
            {task.description}
          </div>
        </div>
      )}
      
      {/* Metadata - more compact layout */}
      <div className="mt-auto space-y-3">
        <div className="flex items-center space-x-1 text-sm text-text-tertiary">
          <User className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getClientName(task.client_id)}</span>
        </div>
        <div className="flex items-center space-x-1 text-sm">
          <Calendar className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <span className={task.due_date && new Date(task.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-text-tertiary'}>
            {formatDate(task.due_date)}
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-2 pt-3 mt-2 border-t border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {task.status === 'completed' ? (
            <Button
              size="sm"
              variant="ghost"
              icon={RotateCcw}
              onClick={() => handleMarkPending(task.id)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Mark as pending"
            />
          ) : task.status === 'pending' ? (
            <Button
              size="sm"
              variant="ghost"
              icon={Clock}
              onClick={() => handleMarkInProgress(task.id)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              title="Mark as in progress"
            />
          ) : null}
          
          {task.status !== 'completed' && (
            <Button
              size="sm"
              variant="ghost"
              icon={CheckCircle}
              onClick={() => handleMarkComplete(task.id)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Mark as complete"
            />
          )}
          
          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            onClick={() => handleDeleteTask(task.id, task.title)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete task"
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
          <TopBar title="Tasks" />
          <div className="max-w-content mx-auto px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-text-secondary">Loading tasks...</p>
            </div>
          </div>
        </div>
        
        {/* Task Detail Dialog */}
        <TaskDetailDialog
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          clients={clients}
          onMarkComplete={handleMarkComplete}
          onMarkPending={handleMarkPending}
          onMarkInProgress={handleMarkInProgress}
          onDelete={handleDeleteTask}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar 
        title="Tasks" 
        action={{
          label: 'Create Task',
          onClick: () => setShowCreateDialog(true),
          icon: Plus
        }}
      />
      
      <div className="max-w-content mx-auto px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Pending</p>
                <p className="text-2xl font-semibold text-text-primary">{tasksByStatus.pending.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">In Progress</p>
                <p className="text-2xl font-semibold text-text-primary">{tasksByStatus.in_progress.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Completed</p>
                <p className="text-2xl font-semibold text-text-primary">{tasksByStatus.completed.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Total Tasks</p>
                <p className="text-2xl font-semibold text-text-primary">{tasks.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 mb-8 shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border-subtle rounded-lg bg-surface-elevated text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="deadline">Deadline</option>
              <option value="follow_up">Follow Up</option>
              <option value="review">Review</option>
              <option value="filing">Filing</option>
            </select>
          </div>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-12 text-center shadow-soft">
            <Clock className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' 
                ? 'No tasks match your filters' 
                : 'No tasks yet'
              }
            </h3>
            <p className="text-text-tertiary mb-4">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first task or upload IRS notices to generate tasks automatically'
              }
            </p>
            {(!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && typeFilter === 'all') && (
              <Button onClick={() => setShowCreateDialog(true)} icon={Plus}>
                Create First Task
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateTask}
        clients={clients}
        loading={loading}
      />
    </div>
  );
}