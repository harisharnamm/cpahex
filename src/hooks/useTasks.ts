import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

export interface Task {
  id: string;
  user_id: string;
  client_id?: string;
  title: string;
  description?: string;
  task_type: 'general' | 'deadline' | 'follow_up' | 'review' | 'filing';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export function useTasks() {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    task_type?: 'general' | 'deadline' | 'follow_up' | 'review' | 'filing';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
    client_id?: string;
  }) => {
    console.log('🔄 Creating task with data:', taskData);
    if (!user) {
      console.error('❌ User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const taskPayload = {
        user_id: user.id,
        title: taskData.title,
        description: taskData.description,
        task_type: taskData.task_type || 'general',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date,
        client_id: taskData.client_id,
        status: 'pending' as const
      };
      
      console.log('📊 Task payload:', taskPayload);
      
      const { data, error: createError } = await supabase
        .from('tasks')
        .insert(taskPayload)
        .select()
        .single();

      console.log('📊 Supabase create result:', { data, error: createError });
      if (createError) {
        throw createError;
      }

      // Add to local state
      setTasks(prev => [data, ...prev]);
      console.log('✅ Task created and added to local state');
      return { success: true, data };
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [user]);

  const updateTaskStatus = useCallback(async (
    taskId: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ) => {
    console.log('🔄 Updating task status:', taskId, 'to', status);
    try {
      const updates: any = { status };
      
      // Set completed_at when marking as completed
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (status !== 'completed') {
        updates.completed_at = null;
      }

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      console.log('📊 Supabase update result:', { data, error: updateError });
      if (updateError) {
        throw updateError;
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));

      console.log('✅ Task status updated successfully');
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating task status:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const getUpcomingTasks = useCallback((limit: number = 5) => {
    const upcomingTasks = tasks
      .filter(task => task.status === 'pending' || task.status === 'in_progress' || task.status === 'completed')
      .sort((a, b) => {
        // Sort by due date, then by created date
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, limit);
    
    console.log('📋 Getting upcoming tasks:', upcomingTasks.length, 'tasks');
    return upcomingTasks;
  }, [tasks]);

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTaskStatus,
    deleteTask,
    getUpcomingTasks,
    refreshTasks: fetchTasks,
    setError,
  };
}