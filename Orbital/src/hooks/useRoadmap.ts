import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Goal, GoalPeriodType, Milestone, Task, YearGoal } from '../types/database';
import { computePeriodRange } from '../lib/goalPeriods';
import { computeGoalProgress } from '../lib/goalProgress';
import { fetchTasks, tasksQueryKey } from './useTasks';
import { fetchGoals, goalsQueryKey } from './useGoals';
import { fetchHabitLogs, fetchHabits, habitLogsQueryKey, habitsQueryKey, type HabitLogRow, type HabitWithLogs } from './useHabits';

export interface GoalWithItems extends Goal {
  tasks: Task[];
  habits: HabitWithLogs[];
}

export interface MilestoneWithGoals extends Milestone {
  goals: GoalWithItems[];
}

export interface YearGoalWithMilestones extends YearGoal {
  milestones: MilestoneWithGoals[];
}

export interface NewYearGoalInput {
  title: string;
  year: number;
}

export interface NewMilestoneInput {
  year_goal_id: string;
  title: string;
  target_date?: string;
}

export interface NewRoadmapGoalInput {
  milestone_id: string;
  title: string;
  period_type: GoalPeriodType;
}

async function fetchYearGoals(): Promise<YearGoal[]> {
  const { data, error } = await supabase.from('year_goals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function fetchMilestones(): Promise<Milestone[]> {
  const { data, error } = await supabase.from('milestones').select('*').order('position', { ascending: true });
  if (error) throw error;
  return data;
}

function yearGoalsQueryKey(userId: string) {
  return ['yearGoals', userId] as const;
}

function milestonesQueryKey(userId: string) {
  return ['milestones', userId] as const;
}

function buildTree(
  yearGoalsData: YearGoal[],
  milestonesData: Milestone[],
  goalsData: Goal[],
  tasksData: Task[],
  habitsData: import('../types/database').Habit[],
  habitLogsData: HabitLogRow[],
): YearGoalWithMilestones[] {
  const tasksByGoal = new Map<string, Task[]>();
  for (const task of tasksData) {
    if (!task.goal_id) continue;
    const list = tasksByGoal.get(task.goal_id) || [];
    list.push(task);
    tasksByGoal.set(task.goal_id, list);
  }

  const logsByHabit = new Map<string, string[]>();
  for (const log of habitLogsData) {
    const list = logsByHabit.get(log.habit_id) || [];
    list.push(log.completed_on);
    logsByHabit.set(log.habit_id, list);
  }
  const habitsByGoal = new Map<string, HabitWithLogs[]>();
  for (const habit of habitsData) {
    if (!habit.goal_id) continue;
    const withLogs: HabitWithLogs = { ...habit, completedDates: logsByHabit.get(habit.id) || [] };
    const list = habitsByGoal.get(habit.goal_id) || [];
    list.push(withLogs);
    habitsByGoal.set(habit.goal_id, list);
  }

  const goalsByMilestone = new Map<string, GoalWithItems[]>();
  for (const goal of goalsData) {
    if (!goal.milestone_id) continue;
    const goalTasks = tasksByGoal.get(goal.id) || [];
    const goalHabits = habitsByGoal.get(goal.id) || [];
    const withItems: GoalWithItems = {
      ...goal,
      progress: computeGoalProgress(goal, goalTasks, goalHabits),
      tasks: goalTasks,
      habits: goalHabits,
    };
    const list = goalsByMilestone.get(goal.milestone_id) || [];
    list.push(withItems);
    goalsByMilestone.set(goal.milestone_id, list);
  }

  const milestonesByYearGoal = new Map<string, MilestoneWithGoals[]>();
  for (const milestone of milestonesData) {
    const withGoals: MilestoneWithGoals = { ...milestone, goals: goalsByMilestone.get(milestone.id) || [] };
    const list = milestonesByYearGoal.get(milestone.year_goal_id) || [];
    list.push(withGoals);
    milestonesByYearGoal.set(milestone.year_goal_id, list);
  }

  return yearGoalsData.map((yg) => ({ ...yg, milestones: milestonesByYearGoal.get(yg.id) || [] }));
}

export function useRoadmap(userId: string) {
  const queryClient = useQueryClient();
  const yearGoalsKey = yearGoalsQueryKey(userId);
  const milestonesKey = milestonesQueryKey(userId);
  const goalsKey = goalsQueryKey(userId);
  const tasksKey = tasksQueryKey(userId);
  const habitsKey = habitsQueryKey(userId);
  const habitLogsKey = habitLogsQueryKey(userId);

  const yearGoalsQuery = useQuery({ queryKey: yearGoalsKey, queryFn: fetchYearGoals, enabled: !!userId });
  const milestonesQuery = useQuery({ queryKey: milestonesKey, queryFn: fetchMilestones, enabled: !!userId });
  const goalsQuery = useQuery({ queryKey: goalsKey, queryFn: fetchGoals, enabled: !!userId });
  const tasksQuery = useQuery({ queryKey: tasksKey, queryFn: fetchTasks, enabled: !!userId });
  const habitsQuery = useQuery({ queryKey: habitsKey, queryFn: fetchHabits, enabled: !!userId });
  const habitLogsQuery = useQuery({ queryKey: habitLogsKey, queryFn: fetchHabitLogs, enabled: !!userId });

  const queries = [yearGoalsQuery, milestonesQuery, goalsQuery, tasksQuery, habitsQuery, habitLogsQuery];
  const loading = queries.some((q) => q.isLoading);
  const firstError = queries.find((q) => q.error)?.error;

  const yearGoals = useMemo(
    () =>
      buildTree(
        yearGoalsQuery.data ?? [],
        milestonesQuery.data ?? [],
        goalsQuery.data ?? [],
        tasksQuery.data ?? [],
        habitsQuery.data ?? [],
        habitLogsQuery.data ?? [],
      ),
    [yearGoalsQuery.data, milestonesQuery.data, goalsQuery.data, tasksQuery.data, habitsQuery.data, habitLogsQuery.data],
  );

  const addYearGoal = useMutation({
    mutationFn: async (input: NewYearGoalInput) => {
      const { error } = await supabase
        .from('year_goals')
        .insert({ user_id: userId, title: input.title, year: input.year });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: yearGoalsKey }),
  });

  const addMilestone = useMutation({
    mutationFn: async ({ input, position }: { input: NewMilestoneInput; position: number }) => {
      const { error } = await supabase.from('milestones').insert({
        user_id: userId,
        year_goal_id: input.year_goal_id,
        title: input.title,
        target_date: input.target_date || null,
        position,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: milestonesKey }),
  });

  const addGoal = useMutation({
    mutationFn: async (input: NewRoadmapGoalInput) => {
      const { start, end } = computePeriodRange(input.period_type);
      const { error } = await supabase.from('goals').insert({
        user_id: userId,
        milestone_id: input.milestone_id,
        title: input.title,
        period_type: input.period_type,
        period_start: start,
        period_end: end,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });

  const updateGoalProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const status = progress >= 100 ? 'completed' : 'active';
      const { error } = await supabase
        .from('goals')
        .update({ progress, status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, progress }) => {
      await queryClient.cancelQueries({ queryKey: goalsKey });
      const previous = queryClient.getQueryData<Goal[]>(goalsKey);
      const status = progress >= 100 ? 'completed' : 'active';
      queryClient.setQueryData<Goal[]>(goalsKey, (old) =>
        old?.map((g) => (g.id === id ? { ...g, progress, status, updated_at: new Date().toISOString() } : g)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(goalsKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });

  const updateMilestoneStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Milestone['status'] }) => {
      const { error } = await supabase
        .from('milestones')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: milestonesKey }),
  });

  const removeYearGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('year_goals').delete().eq('id', id);
      if (error) throw error;
    },
    // Deleting a year goal cascades to its milestones/goals — refresh both, not just year_goals.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: yearGoalsKey });
      queryClient.invalidateQueries({ queryKey: milestonesKey });
      queryClient.invalidateQueries({ queryKey: goalsKey });
    },
  });

  const removeMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('milestones').delete().eq('id', id);
      if (error) throw error;
    },
    // Deleting a milestone cascades to its goals — refresh both.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestonesKey });
      queryClient.invalidateQueries({ queryKey: goalsKey });
    },
  });

  const removeGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });

  return {
    yearGoals,
    loading,
    error: firstError ? (firstError as Error).message : null,
    addYearGoal: (input: NewYearGoalInput) => addYearGoal.mutateAsync(input),
    addMilestone: (input: NewMilestoneInput, position: number) => addMilestone.mutateAsync({ input, position }),
    addGoal: (input: NewRoadmapGoalInput) => addGoal.mutateAsync(input),
    updateGoalProgress: (id: string, progress: number) => updateGoalProgress.mutateAsync({ id, progress }),
    updateMilestoneStatus: (id: string, status: Milestone['status']) => updateMilestoneStatus.mutateAsync({ id, status }),
    removeYearGoal: (id: string) => removeYearGoal.mutateAsync(id),
    removeMilestone: (id: string) => removeMilestone.mutateAsync(id),
    removeGoal: (id: string) => removeGoal.mutateAsync(id),
  };
}
