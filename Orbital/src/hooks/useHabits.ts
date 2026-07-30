import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Habit } from '../types/database';
import { todayStr } from '../lib/habitStreak';

export interface HabitWithLogs extends Habit {
  completedDates: string[];
}

export interface NewHabitInput {
  name: string;
  /** Weekdays this habit runs — 0 = Sunday ... 6 = Saturday. */
  days_of_week: number[];
  goal_id?: string | null;
}

export interface HabitLogRow {
  habit_id: string;
  completed_on: string;
}

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase.from('habits').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchHabitLogs(): Promise<HabitLogRow[]> {
  const { data, error } = await supabase.from('habit_logs').select('habit_id, completed_on');
  if (error) throw error;
  return data;
}

export function habitsQueryKey(userId: string) {
  return ['habits', userId] as const;
}

export function habitLogsQueryKey(userId: string) {
  return ['habitLogs', userId] as const;
}

export function useHabits(userId: string) {
  const queryClient = useQueryClient();
  const habitsKey = habitsQueryKey(userId);
  const logsKey = habitLogsQueryKey(userId);

  const habitsQuery = useQuery({ queryKey: habitsKey, queryFn: fetchHabits, enabled: !!userId });
  const logsQuery = useQuery({ queryKey: logsKey, queryFn: fetchHabitLogs, enabled: !!userId });

  const habits = useMemo<HabitWithLogs[]>(() => {
    const logsByHabit = new Map<string, string[]>();
    for (const log of logsQuery.data ?? []) {
      const list = logsByHabit.get(log.habit_id) || [];
      list.push(log.completed_on);
      logsByHabit.set(log.habit_id, list);
    }
    return (habitsQuery.data ?? []).map((habit) => ({ ...habit, completedDates: logsByHabit.get(habit.id) || [] }));
  }, [habitsQuery.data, logsQuery.data]);

  const addHabit = useMutation({
    mutationFn: async (input: NewHabitInput) => {
      const { error } = await supabase.from('habits').insert({
        user_id: userId,
        name: input.name,
        // frequency is superseded by days_of_week — kept only to satisfy the
        // still-existing NOT NULL column, not read anywhere anymore.
        frequency: 'daily',
        target_per_period: 1,
        days_of_week: input.days_of_week,
        goal_id: input.goal_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: habitsKey }),
  });

  const toggleToday = useMutation({
    mutationFn: async (habit: HabitWithLogs) => {
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
    },
    onMutate: async (habit: HabitWithLogs) => {
      await queryClient.cancelQueries({ queryKey: logsKey });
      const previous = queryClient.getQueryData<HabitLogRow[]>(logsKey);
      const today = todayStr();
      const alreadyDone = habit.completedDates.includes(today);
      queryClient.setQueryData<HabitLogRow[]>(logsKey, (old = []) =>
        alreadyDone
          ? old.filter((l) => !(l.habit_id === habit.id && l.completed_on === today))
          : [...old, { habit_id: habit.id, completed_on: today }],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(logsKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: logsKey }),
  });

  const removeHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: habitsKey }),
  });

  return {
    habits,
    loading: habitsQuery.isLoading || logsQuery.isLoading,
    error: (habitsQuery.error || logsQuery.error) ? ((habitsQuery.error || logsQuery.error) as Error).message : null,
    addHabit: (input: NewHabitInput) => addHabit.mutateAsync(input),
    toggleToday: (habit: HabitWithLogs) => toggleToday.mutateAsync(habit),
    removeHabit: (id: string) => removeHabit.mutateAsync(id),
  };
}
