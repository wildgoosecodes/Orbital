import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { TimeBlock } from '../types/database';
import { tasksQueryKey } from './useTasks';
import { habitLogsQueryKey } from './useHabits';
import { todayStr } from '../lib/habitStreak';

export interface NewTimeBlockInput {
  title: string;
  category?: string;
  start_at: string;
  end_at: string;
  task_id?: string | null;
  habit_id?: string | null;
}

export async function fetchTimeBlocks(): Promise<TimeBlock[]> {
  const { data, error } = await supabase.from('time_blocks').select('*').order('start_at', { ascending: true });
  if (error) throw error;
  return data;
}

export function timeBlocksQueryKey(userId: string) {
  return ['timeBlocks', userId] as const;
}

export function useTimeBlocks(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = timeBlocksQueryKey(userId);

  const { data: timeBlocks = [], isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: fetchTimeBlocks,
    enabled: !!userId,
  });

  const addTimeBlock = useMutation({
    mutationFn: async (input: NewTimeBlockInput) => {
      const { error } = await supabase.from('time_blocks').insert({
        user_id: userId,
        title: input.title,
        category: input.category || null,
        start_at: input.start_at,
        end_at: input.end_at,
        task_id: input.task_id || null,
        habit_id: input.habit_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateTimeBlock = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: NewTimeBlockInput }) => {
      const { error } = await supabase
        .from('time_blocks')
        .update({
          title: updates.title,
          category: updates.category || null,
          start_at: updates.start_at,
          end_at: updates.end_at,
          task_id: updates.task_id || null,
          habit_id: updates.habit_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeTimeBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Completing a linked block also completes the task/habit it wraps — but
  // this is one-directional. Marking the task/habit done from its own tab
  // does *not* flip the block back, since a block has no listener there.
  const toggleComplete = useMutation({
    mutationFn: async (block: TimeBlock) => {
      const nextCompleted = !block.is_completed;
      const { error } = await supabase
        .from('time_blocks')
        .update({ is_completed: nextCompleted, updated_at: new Date().toISOString() })
        .eq('id', block.id);
      if (error) throw error;

      if (block.task_id) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: nextCompleted ? 'done' : 'todo', updated_at: new Date().toISOString() })
          .eq('id', block.task_id);
        if (taskError) throw taskError;
      } else if (block.habit_id) {
        const today = todayStr();
        if (nextCompleted) {
          const { error: logError } = await supabase
            .from('habit_logs')
            .upsert({ habit_id: block.habit_id, user_id: userId, completed_on: today }, { onConflict: 'habit_id,completed_on' });
          if (logError) throw logError;
        } else {
          const { error: logError } = await supabase
            .from('habit_logs')
            .delete()
            .eq('habit_id', block.habit_id)
            .eq('completed_on', today);
          if (logError) throw logError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: habitLogsQueryKey(userId) });
    },
  });

  return {
    timeBlocks,
    loading,
    error: error ? (error as Error).message : null,
    addTimeBlock: (input: NewTimeBlockInput) => addTimeBlock.mutateAsync(input),
    updateTimeBlock: (id: string, updates: NewTimeBlockInput) => updateTimeBlock.mutateAsync({ id, updates }),
    removeTimeBlock: (id: string) => removeTimeBlock.mutateAsync(id),
    toggleComplete: (block: TimeBlock) => toggleComplete.mutateAsync(block),
  };
}
