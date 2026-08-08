import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { TimeBlock } from '../types/database';

export interface NewTimeBlockInput {
  title: string;
  category?: string;
  start_at: string;
  end_at: string;
}

export interface TimingUpdate {
  id: string;
  start_at: string;
  end_at: string;
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
      const { data, error } = await supabase
        .from('time_blocks')
        .insert({
          user_id: userId,
          title: input.title,
          category: input.category || null,
          start_at: input.start_at,
          end_at: input.end_at,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TimeBlock;
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Lightweight timing-only write for drag-move/drag-resize commits — skips
  // the full form payload since those interactions never touch title/category.
  const updateTiming = useMutation({
    mutationFn: async ({ id, start_at, end_at }: TimingUpdate) => {
      const { error } = await supabase
        .from('time_blocks')
        .update({ start_at, end_at, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Batched version of updateTiming, for the "push later blocks" conflict
  // resolution which shifts several blocks in one go.
  const applyCascade = useMutation({
    mutationFn: async (updates: TimingUpdate[]) => {
      const results = await Promise.all(
        updates.map(({ id, start_at, end_at }) =>
          supabase.from('time_blocks').update({ start_at, end_at, updated_at: new Date().toISOString() }).eq('id', id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
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

  const toggleComplete = useMutation({
    mutationFn: async (block: TimeBlock) => {
      const { error } = await supabase
        .from('time_blocks')
        .update({ is_completed: !block.is_completed, updated_at: new Date().toISOString() })
        .eq('id', block.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    timeBlocks,
    loading,
    error: error ? (error as Error).message : null,
    addTimeBlock: (input: NewTimeBlockInput) => addTimeBlock.mutateAsync(input),
    updateTimeBlock: (id: string, updates: NewTimeBlockInput) => updateTimeBlock.mutateAsync({ id, updates }),
    updateTiming: (id: string, start_at: string, end_at: string) => updateTiming.mutateAsync({ id, start_at, end_at }),
    applyCascade: (updates: TimingUpdate[]) => applyCascade.mutateAsync(updates),
    removeTimeBlock: (id: string) => removeTimeBlock.mutateAsync(id),
    toggleComplete: (block: TimeBlock) => toggleComplete.mutateAsync(block),
  };
}
