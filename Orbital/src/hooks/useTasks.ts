import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Task, TaskPriority, TaskStatus } from '../types/database';

export interface NewTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
  category?: string;
  goal_id?: string | null;
  next_action?: string;
  estimated_minutes?: number | null;
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
        goal_id: input.goal_id || null,
        next_action: input.next_action || null,
        estimated_minutes: input.estimated_minutes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      // A completed task should never stay pinned as NOW — otherwise
      // un-completing it later would silently resurface it, overriding
      // whatever the ranking would actually pick.
      const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === 'done') patch.pinned_now = false;
      const { error } = await supabase.from('tasks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, status, pinned_now: status === 'done' ? false : t.pinned_now, updated_at: new Date().toISOString() }
            : t,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const setTimeBlock = useMutation({
    mutationFn: async ({ id, timeBlockId }: { id: string; timeBlockId: string | null }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ time_block_id: timeBlockId, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, timeBlockId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((t) => (t.id === id ? { ...t, time_block_id: timeBlockId, updated_at: new Date().toISOString() } : t)),
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
          goal_id: updates.goal_id || null,
          next_action: updates.next_action || null,
          estimated_minutes: updates.estimated_minutes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const setFocusFields = useMutation({
    mutationFn: async ({ id, next_action, estimated_minutes }: { id: string; next_action?: string; estimated_minutes?: number }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (next_action !== undefined) patch.next_action = next_action || null;
      if (estimated_minutes !== undefined) patch.estimated_minutes = estimated_minutes;
      const { error } = await supabase.from('tasks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, next_action, estimated_minutes }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((t) =>
          t.id === id
            ? {
                ...t,
                next_action: next_action !== undefined ? next_action || null : t.next_action,
                estimated_minutes: estimated_minutes !== undefined ? estimated_minutes : t.estimated_minutes,
              }
            : t,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Only one task can be pinned as NOW at a time — clear whichever task
  // currently holds it (if any) before setting the new one. The partial
  // unique index on tasks(user_id) where pinned_now is the safety net if
  // these two updates ever raced.
  const pinNow = useMutation({
    mutationFn: async (id: string) => {
      const { error: clearError } = await supabase
        .from('tasks')
        .update({ pinned_now: false })
        .eq('user_id', userId)
        .eq('pinned_now', true);
      if (clearError) throw clearError;
      const { error } = await supabase.from('tasks').update({ pinned_now: true }).eq('id', id);
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
    setTimeBlock: (id: string, timeBlockId: string | null) => setTimeBlock.mutateAsync({ id, timeBlockId }),
    updateTask: (id: string, updates: NewTaskInput) => updateTask.mutateAsync({ id, updates }),
    setFocusFields: (id: string, fields: { next_action?: string; estimated_minutes?: number }) =>
      setFocusFields.mutateAsync({ id, ...fields }),
    pinNow: (id: string) => pinNow.mutateAsync(id),
    removeTask: (id: string) => removeTask.mutateAsync(id),
  };
}
