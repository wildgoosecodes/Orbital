import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Goal, GoalPeriodType } from '../types/database';
import { computePeriodRange } from '../lib/goalPeriods';

export interface NewGoalInput {
  title: string;
  period_type: GoalPeriodType;
}

export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export function goalsQueryKey(userId: string) {
  return ['goals', userId] as const;
}

export function useGoals(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = goalsQueryKey(userId);

  const { data: goals = [], isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: fetchGoals,
    enabled: !!userId,
  });

  const addGoal = useMutation({
    mutationFn: async (input: NewGoalInput) => {
      const { start, end } = computePeriodRange(input.period_type);
      const { error } = await supabase.from('goals').insert({
        user_id: userId,
        title: input.title,
        period_type: input.period_type,
        period_start: start,
        period_end: end,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const status = progress >= 100 ? 'completed' : 'active';
      const { error } = await supabase
        .from('goals')
        .update({ progress, status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, progress }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Goal[]>(queryKey);
      const status = progress >= 100 ? 'completed' : 'active';
      queryClient.setQueryData<Goal[]>(queryKey, (old) =>
        old?.map((g) => (g.id === id ? { ...g, progress, status, updated_at: new Date().toISOString() } : g)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    goals,
    loading,
    error: error ? (error as Error).message : null,
    addGoal: (input: NewGoalInput) => addGoal.mutateAsync(input),
    updateProgress: (id: string, progress: number) => updateProgress.mutateAsync({ id, progress }),
    removeGoal: (id: string) => removeGoal.mutateAsync(id),
  };
}
