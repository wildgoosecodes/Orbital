import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Goal, GoalPeriodType } from '../types/database';
import { computePeriodRange } from '../lib/goalPeriods';

export interface NewGoalInput {
  title: string;
  period_type: GoalPeriodType;
}

export function useGoals(userId: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setGoals(data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addGoal(input: NewGoalInput) {
    const { start, end } = computePeriodRange(input.period_type);
    const { error } = await supabase.from('goals').insert({
      user_id: userId,
      title: input.title,
      period_type: input.period_type,
      period_start: start,
      period_end: end,
    });
    if (error) throw error;
    await refresh();
  }

  async function updateProgress(id: string, progress: number) {
    const status = progress >= 100 ? 'completed' : 'active';
    const { error } = await supabase
      .from('goals')
      .update({ progress, status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function removeGoal(id: string) {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return { goals, loading, error, addGoal, updateProgress, removeGoal };
}
