import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Task, TaskPriority, TaskStatus } from '../types/database';

export interface NewTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  category?: string;
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export function tasksQueryKey(userId: string) {
  return ['tasks', userId] as const;
}

export function useTasks(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = tasksQueryKey(userId);

  const { data: tasks = [], isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: fetchTasks,
    enabled: !!userId,
  });

  const addTask = useMutation({
    mutationFn: async (input: NewTaskInput) => {
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: input.title,
        description: input.description || null,
        priority: input.priority || 'medium',
        due_date: input.due_date || null,
        category: input.category || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status, updated_at: new Date().toISOString() } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: NewTaskInput }) => {
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
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    tasks,
    loading,
    error: error ? (error as Error).message : null,
    addTask: (input: NewTaskInput) => addTask.mutateAsync(input),
    setStatus: (id: string, status: TaskStatus) => setStatus.mutateAsync({ id, status }),
    updateTask: (id: string, updates: NewTaskInput) => updateTask.mutateAsync({ id, updates }),
    removeTask: (id: string) => removeTask.mutateAsync(id),
  };
}
