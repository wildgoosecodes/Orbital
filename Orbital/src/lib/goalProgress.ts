import type { Goal, Task } from '../types/database';
import type { HabitWithLogs } from '../hooks/useHabits';

const EXPECTED_DAYS_PER_WEEK: Record<HabitWithLogs['frequency'], number> = {
  daily: 7,
  weekly: 1,
};

/** % of the trailing 7 days completed, relative to how often the habit is expected to happen. */
export function habitConsistency(habit: HabitWithLogs): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recentCount = habit.completedDates.filter((d) => d >= cutoffStr).length;
  const expected = EXPECTED_DAYS_PER_WEEK[habit.frequency];
  return Math.min(100, Math.round((recentCount / expected) * 100));
}

/**
 * Goals with linked tasks/habits get their progress computed from real completion
 * instead of the manual slider — average of task-completion % and habit consistency.
 * Goals with nothing linked keep the stored manual value untouched.
 */
export function computeGoalProgress(goal: Goal, tasks: Task[], habits: HabitWithLogs[]): number {
  if (tasks.length === 0 && habits.length === 0) return goal.progress;

  const scores: number[] = [];
  if (tasks.length > 0) {
    const done = tasks.filter((t) => t.status === 'done').length;
    scores.push((done / tasks.length) * 100);
  }
  for (const habit of habits) {
    scores.push(habitConsistency(habit));
  }
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}
