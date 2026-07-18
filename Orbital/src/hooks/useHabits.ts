import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Habit, HabitFrequency } from '../types/database';
import { todayStr } from '../lib/habitStreak';

export interface HabitWithLogs extends Habit {
  completedDates: string[];
}

export interface NewHabitInput {
  name: string;
  frequency: HabitFrequency;
}

export function useHabits(userId: string) {
  const [habits, setHabits] = useState<HabitWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [habitsRes, logsRes] = await Promise.all([
      supabase.from('habits').select('*').order('created_at', { ascending: false }),
      supabase.from('habit_logs').select('habit_id, completed_on'),
    ]);

    if (habitsRes.error) {
      setError(habitsRes.error.message);
      setLoading(false);
      return;
    }
    if (logsRes.error) {
      setError(logsRes.error.message);
      setLoading(false);
      return;
    }

    const logsByHabit = new Map<string, string[]>();
    for (const log of logsRes.data) {
      const list = logsByHabit.get(log.habit_id) || [];
      list.push(log.completed_on);
      logsByHabit.set(log.habit_id, list);
    }

    setHabits(habitsRes.data.map((habit) => ({ ...habit, completedDates: logsByHabit.get(habit.id) || [] })));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addHabit(input: NewHabitInput) {
    const { error } = await supabase.from('habits').insert({
      user_id: userId,
      name: input.name,
      frequency: input.frequency,
      target_per_period: 1,
    });
    if (error) throw error;
    await refresh();
  }

  async function toggleToday(habit: HabitWithLogs) {
    const today = todayStr();
    if (habit.completedDates.includes(today)) {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habit.id)
        .eq('completed_on', today);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .insert({ habit_id: habit.id, user_id: userId, completed_on: today });
      if (error) throw error;
    }
    await refresh();
  }

  async function removeHabit(id: string) {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return { habits, loading, error, addHabit, toggleToday, removeHabit };
}
