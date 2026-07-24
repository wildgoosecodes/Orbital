import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Task, TaskPriority, TaskStatus } from '../types/database';

export interface NewTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  category?: string;
}

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setTasks(data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addTask(input: NewTaskInput) {
    const { error } = await supabase.from('tasks').insert({
      user_id: userId,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      due_date: input.due_date || null,
      category: input.category || null,
    });
    if (error) throw error;
    await refresh();
  }

  async function setStatus(id: string, status: TaskStatus) {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function updateTask(id: string, updates: NewTaskInput) {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description || null,
        priority: updates.priority || 'medium',
        due_date: updates.due_date || null,
        category: updates.category || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function removeTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return { tasks, loading, error, addTask, setStatus, updateTask, removeTask };
}
