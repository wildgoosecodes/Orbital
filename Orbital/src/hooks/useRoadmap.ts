import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Goal, GoalPeriodType, Milestone, YearGoal } from '../types/database';
import { computePeriodRange } from '../lib/goalPeriods';

export interface MilestoneWithGoals extends Milestone {
  goals: Goal[];
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

export function useRoadmap(userId: string) {
  const [yearGoals, setYearGoals] = useState<YearGoalWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [yearGoalsRes, milestonesRes, goalsRes] = await Promise.all([
      supabase.from('year_goals').select('*').order('created_at', { ascending: false }),
      supabase.from('milestones').select('*').order('position', { ascending: true }),
      supabase.from('goals').select('*').order('created_at', { ascending: false }),
    ]);
    if (yearGoalsRes.error) {
      setError(yearGoalsRes.error.message);
      setLoading(false);
      return;
    }
    if (milestonesRes.error) {
      setError(milestonesRes.error.message);
      setLoading(false);
      return;
    }
    if (goalsRes.error) {
      setError(goalsRes.error.message);
      setLoading(false);
      return;
    }

    const goalsByMilestone = new Map<string, Goal[]>();
    for (const goal of goalsRes.data) {
      if (!goal.milestone_id) continue;
      const list = goalsByMilestone.get(goal.milestone_id) || [];
      list.push(goal);
      goalsByMilestone.set(goal.milestone_id, list);
    }

    const milestonesByYearGoal = new Map<string, MilestoneWithGoals[]>();
    for (const milestone of milestonesRes.data) {
      const withGoals: MilestoneWithGoals = { ...milestone, goals: goalsByMilestone.get(milestone.id) || [] };
      const list = milestonesByYearGoal.get(milestone.year_goal_id) || [];
      list.push(withGoals);
      milestonesByYearGoal.set(milestone.year_goal_id, list);
    }

    setYearGoals(
      yearGoalsRes.data.map((yg) => ({ ...yg, milestones: milestonesByYearGoal.get(yg.id) || [] })),
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addYearGoal(input: NewYearGoalInput) {
    const { error } = await supabase
      .from('year_goals')
      .insert({ user_id: userId, title: input.title, year: input.year });
    if (error) throw error;
    await refresh();
  }

  async function addMilestone(input: NewMilestoneInput, position: number) {
    const { error } = await supabase.from('milestones').insert({
      user_id: userId,
      year_goal_id: input.year_goal_id,
      title: input.title,
      target_date: input.target_date || null,
      position,
    });
    if (error) throw error;
    await refresh();
  }

  async function addGoal(input: NewRoadmapGoalInput) {
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
    await refresh();
  }

  async function updateGoalProgress(id: string, progress: number) {
    const status = progress >= 100 ? 'completed' : 'active';
    const { error } = await supabase
      .from('goals')
      .update({ progress, status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function updateMilestoneStatus(id: string, status: Milestone['status']) {
    const { error } = await supabase
      .from('milestones')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function removeYearGoal(id: string) {
    const { error } = await supabase.from('year_goals').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function removeMilestone(id: string) {
    const { error } = await supabase.from('milestones').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  async function removeGoal(id: string) {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  }

  return {
    yearGoals,
    loading,
    error,
    addYearGoal,
    addMilestone,
    addGoal,
    updateGoalProgress,
    updateMilestoneStatus,
    removeYearGoal,
    removeMilestone,
    removeGoal,
  };
}
